-- SQL migration to support dynamic feedbacks, rate limits, and tutor ratings
-- Execute this script in your Supabase SQL Editor.

-- 1. Create public.feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id)
);

-- 2. Add rating column to public.tutor_profiles if it does not exist
ALTER TABLE public.tutor_profiles ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);

-- 3. Create anti-spam check feedback limit function
CREATE OR REPLACE FUNCTION public.check_feedback_limit()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_count integer;
BEGIN
  -- If user_id is null, bypass check (e.g. seeded feedbacks or admin entry without user link)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user role
  SELECT role::text INTO v_role FROM public.users WHERE id = NEW.user_id;
  
  -- Guardians are limited to 5 feedbacks per calendar day (UTC/Local depending on timezone configuration)
  IF v_role = 'guardian' THEN
    SELECT count(*) INTO v_count 
    FROM public.feedbacks 
    WHERE user_id = NEW.user_id 
      AND created_at >= date_trunc('day', now());
      
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'You have reached the maximum limit of 5 feedback submissions for today.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for feedback limit
DROP TRIGGER IF EXISTS trg_check_feedback_limit ON public.feedbacks;
CREATE TRIGGER trg_check_feedback_limit
  BEFORE INSERT ON public.feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_feedback_limit();

-- 5. Enable Row Level Security
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 6. Re-create RLS Policies for public.feedbacks
DROP POLICY IF EXISTS select_feedbacks ON public.feedbacks;
DROP POLICY IF EXISTS insert_feedbacks ON public.feedbacks;
DROP POLICY IF EXISTS all_admin_feedbacks ON public.feedbacks;

-- Allow public selection of approved & published feedbacks, or user viewing their own submissions, or admins viewing all
CREATE POLICY select_feedbacks ON public.feedbacks
  FOR SELECT
  USING (
    is_published = true 
    OR (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')))
  );

-- Allow authenticated users to insert their own feedbacks, or admins to insert any
CREATE POLICY insert_feedbacks ON public.feedbacks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Allow admins to manage, approve, edit, delete any feedbacks
CREATE POLICY all_admin_feedbacks ON public.feedbacks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 7. Seed initial dynamic parent reviews as approved and published
INSERT INTO public.feedbacks (name, rating, comment, status, is_published) VALUES
  ('Rafiqul Islam', 5, 'Tutor Core found the perfect math tutor for my son. His grades improved significantly within a month. Highly professional service!', 'approved', true),
  ('Nusrat Jahan', 5, 'The process was so smooth. I posted my requirement and got verified CVs the same day. The tutor is excellent and very punctual.', 'approved', true),
  ('Ahmed Chowdhury', 5, 'I appreciate how they verify every tutor. It gave me peace of mind knowing my daughter is learning from a safe, qualified professional.', 'approved', true)
ON CONFLICT DO NOTHING;
