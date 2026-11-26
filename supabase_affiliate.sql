-- ============================================================================
-- Tutor Core: Full Affiliate Bonus System Schema & RLS
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 0. Safely add 'affiliate' to user_role enum if your users.role column uses an enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'affiliate';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not alter user_role enum (skipping if text or already exists): %', SQLERRM;
END
$$;

-- 1. Global Affiliate Settings (Single-row config managed by Admin)
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  global_commission_pct numeric NOT NULL DEFAULT 10,
  default_platform_charge_pct numeric NOT NULL DEFAULT 50,
  min_withdrawal_amount numeric NOT NULL DEFAULT 300,
  hold_days integer NOT NULL DEFAULT 15,
  credit_bonus_pct numeric NOT NULL DEFAULT 10,
  referred_tutor_discount_pct numeric NOT NULL DEFAULT 10,
  payout_terms_text text NOT NULL DEFAULT 'Confirmed commissions are held for 15 days of active tutoring before becoming withdrawable (Due). Cash payouts via bKash or Nagad are processed within 7 working days. Redeem as Tutor Core Credit anytime for +10% extra bonus value.',
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT affiliate_settings_pkey PRIMARY KEY (id)
);

INSERT INTO public.affiliate_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- 2. Affiliate Profiles (One per participating Tutor, Guardian, or Affiliate user)
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  user_id uuid NOT NULL,
  affiliate_code text NOT NULL UNIQUE,
  credit_balance numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT affiliate_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT affiliate_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 3. Affiliate Referrals & Manual Tuition Leads
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  referral_type text NOT NULL CHECK (referral_type IN ('lead_submission', 'guardian_signup', 'tutor_signup')),
  referred_user_id uuid,
  tuition_request_id uuid,
  lead_name text NOT NULL,
  lead_phone text,
  lead_email text,
  lead_city text,
  lead_area text,
  lead_class text,
  lead_category text,
  lead_salary text,
  lead_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'rejected')),
  rejection_reason text,
  platform_charge_amount numeric DEFAULT 0,
  commission_pct numeric DEFAULT 10,
  commission_amount numeric DEFAULT 0,
  commission_status text NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending', 'on_hold', 'due', 'paid', 'cancelled')),
  referred_tutor_discount_pct numeric DEFAULT 10,
  discount_used boolean DEFAULT false,
  confirmed_at timestamp with time zone,
  hold_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT affiliate_referrals_pkey PRIMARY KEY (id),
  CONSTRAINT affiliate_referrals_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT affiliate_referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT affiliate_referrals_tuition_request_id_fkey FOREIGN KEY (tuition_request_id) REFERENCES public.tuition_requests(id) ON DELETE SET NULL
);

-- 4. Affiliate Withdrawal & Platform Credit Redemption Requests
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL,
  request_type text NOT NULL DEFAULT 'cash' CHECK (request_type IN ('cash', 'platform_credit')),
  amount numeric NOT NULL CHECK (amount > 0),
  bonus_credit_amount numeric NOT NULL DEFAULT 0,
  total_credited numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('bKash', 'Nagad', 'Platform Credit')),
  account_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  transaction_id text,
  admin_note text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT affiliate_withdrawals_pkey PRIMARY KEY (id),
  CONSTRAINT affiliate_withdrawals_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- Settings: readable by everyone (for public landing page & rules), writable by admin
DROP POLICY IF EXISTS "affiliate_settings_read_all" ON public.affiliate_settings;
CREATE POLICY "affiliate_settings_read_all"
  ON public.affiliate_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "affiliate_settings_admin_write" ON public.affiliate_settings;
CREATE POLICY "affiliate_settings_admin_write"
  ON public.affiliate_settings FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin'));

-- Affiliate profiles: owner & admin can read/upsert
DROP POLICY IF EXISTS "affiliate_profiles_select" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_select"
  ON public.affiliate_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

DROP POLICY IF EXISTS "affiliate_profiles_insert" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_insert"
  ON public.affiliate_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

DROP POLICY IF EXISTS "affiliate_profiles_update" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_update"
  ON public.affiliate_profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

-- Affiliate referrals: affiliate sees own; admin sees & manages all; signup can insert via RPC
DROP POLICY IF EXISTS "affiliate_referrals_select" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_select"
  ON public.affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid()
    OR referred_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

DROP POLICY IF EXISTS "affiliate_referrals_insert" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_insert"
  ON public.affiliate_referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

DROP POLICY IF EXISTS "affiliate_referrals_admin_update" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_admin_update"
  ON public.affiliate_referrals FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin'));

-- Affiliate withdrawals: owner sees & inserts own; admin manages all
DROP POLICY IF EXISTS "affiliate_withdrawals_select" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals_select"
  ON public.affiliate_withdrawals FOR SELECT
  TO authenticated
  USING (
    affiliate_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

DROP POLICY IF EXISTS "affiliate_withdrawals_insert" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals_insert"
  ON public.affiliate_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (affiliate_id = auth.uid());

DROP POLICY IF EXISTS "affiliate_withdrawals_admin_update" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals_admin_update"
  ON public.affiliate_withdrawals FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin'));

-- 6. SECURITY DEFINER RPC to record referral attribution safely during registration
CREATE OR REPLACE FUNCTION public.record_signup_referral(
  p_referral_code text,
  p_referred_user_id uuid,
  p_referred_role text,
  p_lead_name text,
  p_lead_phone text,
  p_lead_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
  v_aff_phone text;
  v_aff_email text;
  v_settings record;
BEGIN
  IF p_referral_code IS NULL OR trim(p_referral_code) = '' THEN
    RETURN;
  END IF;

  SELECT ap.user_id INTO v_affiliate_id
  FROM public.affiliate_profiles ap
  WHERE upper(ap.affiliate_code) = upper(trim(p_referral_code))
    AND ap.is_active = true
  LIMIT 1;

  IF v_affiliate_id IS NULL THEN
    RETURN;
  END IF;

  -- Self-referral block by user_id, phone, or email
  IF v_affiliate_id = p_referred_user_id THEN
    RETURN;
  END IF;

  SELECT phone_number, email INTO v_aff_phone, v_aff_email
  FROM public.users
  WHERE id = v_affiliate_id;

  IF (p_lead_phone IS NOT NULL AND v_aff_phone IS NOT NULL AND trim(p_lead_phone) = trim(v_aff_phone))
     OR (p_lead_email IS NOT NULL AND v_aff_email IS NOT NULL AND lower(trim(p_lead_email)) = lower(trim(v_aff_email))) THEN
    RETURN;
  END IF;

  SELECT * INTO v_settings FROM public.affiliate_settings LIMIT 1;

  INSERT INTO public.affiliate_referrals (
    affiliate_id,
    referral_type,
    referred_user_id,
    lead_name,
    lead_phone,
    lead_email,
    status,
    commission_pct,
    commission_status,
    referred_tutor_discount_pct
  ) VALUES (
    v_affiliate_id,
    CASE WHEN p_referred_role = 'tutor' THEN 'tutor_signup' ELSE 'guardian_signup' END,
    p_referred_user_id,
    COALESCE(NULLIF(trim(p_lead_name), ''), 'New User'),
    p_lead_phone,
    p_lead_email,
    'pending',
    COALESCE(v_settings.global_commission_pct, 10),
    'pending',
    CASE WHEN p_referred_role = 'tutor' THEN COALESCE(v_settings.referred_tutor_discount_pct, 10) ELSE 0 END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_signup_referral(text, uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_signup_referral(text, uuid, text, text, text, text) TO anon, authenticated;
