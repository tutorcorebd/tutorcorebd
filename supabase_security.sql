-- ============================================================================
-- Tutor Core: Database Security & Column-Level Protection Script
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Secure RPC to fetch guardian_whatsapp & full_address ONLY for authorized users
--    (Admin, owning Guardian, or the Tutor selected for that tuition).
CREATE OR REPLACE FUNCTION public.get_authorized_tuition_contact(p_tuition_id uuid)
RETURNS TABLE (
  guardian_whatsapp text,
  full_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  SELECT role::text INTO v_role FROM public.users WHERE id = v_uid;

  IF v_role = 'admin' THEN
    RETURN QUERY
      SELECT tr.guardian_whatsapp, tr.full_address
      FROM public.tuition_requests tr
      WHERE tr.id = p_tuition_id;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT tr.guardian_whatsapp, tr.full_address
    FROM public.tuition_requests tr
    WHERE tr.id = p_tuition_id
      AND (
        tr.guardian_id = v_uid
        OR EXISTS (
          SELECT 1
          FROM public.job_applications ja
          WHERE ja.tuition_request_id = tr.id
            AND ja.tutor_id = v_uid
            AND ja.status = 'selected'
        )
      );
END;
$$;

REVOKE ALL ON FUNCTION public.get_authorized_tuition_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_authorized_tuition_contact(uuid) TO authenticated;

-- 2. Block unauthenticated (anon) console/API queries from reading sensitive columns
--    on tuition_requests (guardian_whatsapp, full_address)
REVOKE SELECT ON public.tuition_requests FROM anon;
GRANT SELECT (
  id,
  guardian_id,
  student_class,
  subject,
  location,
  salary_range,
  days_per_week,
  status,
  created_at,
  preferred_gender,
  preferred_university,
  tutoring_mode,
  tutoring_time,
  preferred_category,
  duration,
  number_of_students,
  hiring_from,
  other_requirement,
  views,
  children,
  salary_type,
  salary_amount,
  salary_frequency,
  days_count,
  has_custom_institution,
  student_gender
) ON public.tuition_requests TO anon;

-- 3. Block unauthenticated (anon) console/API queries from reading sensitive PII
--    on tutor_profiles (NID, certificates, DOB, parents' names, emergency contacts, address, WhatsApp)
REVOKE SELECT ON public.tutor_profiles FROM anon;
GRANT SELECT (
  user_id,
  education_status,
  preferred_subjects,
  cv_url,
  profile_completeness,
  is_verified,
  bio,
  current_city,
  preferred_locations,
  university,
  department,
  is_hsc_student,
  living_location,
  preferred_category,
  preferred_courses,
  experience,
  available_days,
  teaching_method,
  available_from,
  available_to,
  expected_salary,
  school_name,
  school_group,
  school_curriculum,
  school_board,
  school_gpa,
  school_year,
  college_name,
  college_group,
  college_curriculum,
  college_board,
  college_gpa,
  college_year,
  grad_gpa,
  grad_year,
  post_grad_university,
  post_grad_department,
  post_grad_gpa,
  post_grad_year,
  gender,
  photo_url,
  tutor_category,
  tutor_status,
  facebook_link,
  linkedin_link,
  about_yourself,
  reasons_for_hiring,
  tuition_experience_details,
  personal_motivation,
  blood_group,
  religion,
  rating,
  is_premium
) ON public.tutor_profiles TO anon;

-- 4. Block unauthenticated (anon) console/API queries from reading user phone numbers & emails
REVOKE SELECT ON public.users FROM anon;
GRANT SELECT (
  id,
  role,
  full_name,
  created_at,
  status,
  last_login
) ON public.users TO anon;

-- 5. Enable Row Level Security (RLS) on private/sensitive tables
ALTER TABLE public.guardian_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Guardian profiles: only owner or admin can view/edit
DROP POLICY IF EXISTS "guardian_profiles_owner_or_admin_select" ON public.guardian_profiles;
CREATE POLICY "guardian_profiles_owner_or_admin_select"
  ON public.guardian_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

-- Membership requests: only owner or admin can view
DROP POLICY IF EXISTS "membership_requests_owner_or_admin_select" ON public.membership_requests;
CREATE POLICY "membership_requests_owner_or_admin_select"
  ON public.membership_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

-- Support tickets: only owner or admin can view
DROP POLICY IF EXISTS "support_tickets_owner_or_admin_select" ON public.support_tickets;
CREATE POLICY "support_tickets_owner_or_admin_select"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );

-- Support messages: only ticket owner or admin can view
DROP POLICY IF EXISTS "support_messages_owner_or_admin_select" ON public.support_messages;
CREATE POLICY "support_messages_owner_or_admin_select"
  ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role::text = 'admin')
  );
