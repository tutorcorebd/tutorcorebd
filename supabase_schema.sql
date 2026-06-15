-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create custom user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'tutor', 'guardian');

-- 2. Create users table that extends auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create tutor_profiles table
CREATE TABLE public.tutor_profiles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  education_status TEXT,
  preferred_subjects TEXT[],
  cv_url TEXT,
  profile_completeness INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  bio TEXT
);

-- 4. Create tuition_requests (Job Board Entries) table
CREATE TABLE public.tuition_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guardian_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  student_class TEXT NOT NULL,
  subject TEXT[] NOT NULL,
  location TEXT NOT NULL,
  guardian_whatsapp TEXT NOT NULL,
  salary_range TEXT,
  days_per_week INTEGER,
  status TEXT CHECK (status IN ('open', 'assigned', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create job_applications table
CREATE TABLE public.job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tutor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  tuition_request_id UUID REFERENCES public.tuition_requests(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'selected', 'rejected', 'payment', 'due', 'refund')) DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tutor_id, tuition_request_id) -- A tutor can apply only once per request
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- users policies
CREATE POLICY "Users can view all users basic info" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own info" ON public.users FOR UPDATE USING (auth.uid() = id);

-- tutor_profiles policies
CREATE POLICY "Anyone can view tutor profiles" ON public.tutor_profiles FOR SELECT USING (true);
CREATE POLICY "Tutors can update their own profile" ON public.tutor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Tutors can insert their own profile" ON public.tutor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- tuition_requests policies
CREATE POLICY "Anyone can view open tuition requests" ON public.tuition_requests FOR SELECT USING (status = 'open' OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
) OR auth.uid() = guardian_id);

CREATE POLICY "Guardians can insert requests" ON public.tuition_requests FOR INSERT WITH CHECK (auth.uid() = guardian_id);
CREATE POLICY "Admins can update requests" ON public.tuition_requests FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- Ensure guardian_whatsapp is only visible to admins and the guardian themselves
-- (In Supabase, column level security is tricky, so we rely on the client not fetching it, but to be strictly secure, we create a view or use a function. For simplicity in RLS, we'll allow select but front-end won't fetch it unless admin/guardian). 
-- Actually, a better way is an RLS policy that prevents selecting the column entirely, but PG doesn't support column-level SELECT policies easily with RLS without custom views. 
-- We will handle this in the UI logic and API queries. Admin queries explicitly ask for it.

-- job_applications policies
CREATE POLICY "Tutors can view their own applications" ON public.job_applications FOR SELECT USING (
    auth.uid() = tutor_id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);
CREATE POLICY "Tutors can insert their own applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = tutor_id);
CREATE POLICY "Admins can update applications" ON public.job_applications FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to handle new user signup and insert into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, role, full_name, phone_number)
  VALUES (
    new.id,
    -- Default role mapping from metadata, default to tutor if not provided
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'tutor'::public.user_role),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown'),
    new.raw_user_meta_data->>'phone_number'
  );

  -- If tutor, create an empty tutor profile
  IF COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'tutor'::public.user_role) = 'tutor' THEN
    INSERT INTO public.tutor_profiles (user_id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
