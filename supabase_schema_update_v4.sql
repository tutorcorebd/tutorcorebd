-- SQL migration to support multi-children posts, custom salary modes, and university suggestions
-- Execute this script in your Supabase SQL Editor.

-- 1. Create public.institutions table if not exists
CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT institutions_pkey PRIMARY KEY (id)
);

-- 2. Add columns to public.tuition_requests for multi-children and flexible settings
ALTER TABLE public.tuition_requests ADD COLUMN IF NOT EXISTS children jsonb;
ALTER TABLE public.tuition_requests ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'range' CHECK (salary_type = ANY (ARRAY['range'::text, 'fixed'::text]));
ALTER TABLE public.tuition_requests ADD COLUMN IF NOT EXISTS salary_amount numeric;
ALTER TABLE public.tuition_requests ADD COLUMN IF NOT EXISTS salary_frequency text;
ALTER TABLE public.tuition_requests ADD COLUMN IF NOT EXISTS days_count integer;
ALTER TABLE public.tuition_requests ADD COLUMN IF NOT EXISTS has_custom_institution boolean DEFAULT false;

-- 3. Enable RLS on public.institutions
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- 4. Re-create RLS Policies for public.institutions
DROP POLICY IF EXISTS select_institutions ON public.institutions;
DROP POLICY IF EXISTS insert_institutions ON public.institutions;
DROP POLICY IF EXISTS all_admin_institutions ON public.institutions;

-- Allow anyone to select approved or pending institutions for search suggestion display
CREATE POLICY select_institutions ON public.institutions
  FOR SELECT
  USING (true);

-- Allow authenticated users (tutors/guardians) to suggest/insert a new institution
CREATE POLICY insert_institutions ON public.institutions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
  );

-- Helper function to check if the active user is an administrator (if not already created)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow admins to perform all operations (Approve, delete, edit)
CREATE POLICY all_admin_institutions ON public.institutions
  FOR ALL
  TO authenticated
  USING ( public.is_admin() )
  WITH CHECK ( public.is_admin() );

-- 5. Seed initial default universities list as approved
INSERT INTO public.institutions (name, status) VALUES
  ('Dhaka University (DU)', 'approved'),
  ('Bangladesh University of Engineering and Technology (BUET)', 'approved'),
  ('Jahangirnagar University (JU)', 'approved'),
  ('Chittagong University (CU)', 'approved'),
  ('Rajshahi University (RU)', 'approved'),
  ('North South University (NSU)', 'approved'),
  ('BRAC University', 'approved'),
  ('East West University (EWU)', 'approved'),
  ('American International University-Bangladesh (AIUB)', 'approved'),
  ('Independent University, Bangladesh (IUB)', 'approved'),
  ('Ahsanullah University of Science and Technology (AUST)', 'approved'),
  ('Shahjalal University of Science and Technology (SUST)', 'approved'),
  ('Khulna University of Engineering & Technology (KUET)', 'approved'),
  ('Chittagong University of Engineering & Technology (CUET)', 'approved'),
  ('Rajshahi University of Engineering & Technology (RUET)', 'approved'),
  ('Mymensingh Engineering College', 'approved'),
  ('Jagannath University', 'approved'),
  ('National University', 'approved')
ON CONFLICT (name) DO NOTHING;
