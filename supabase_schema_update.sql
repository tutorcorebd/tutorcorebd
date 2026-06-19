-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon_name text DEFAULT 'BookOpen',
  show_on_homepage boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Courses (Classes) Table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_popular boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(category_id, name)
);

-- 3. Create Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_category_mode text DEFAULT 'default' CHECK (homepage_category_mode = ANY (ARRAY['default'::text, 'custom'::text, 'active_tuitions'::text])),
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
DROP POLICY IF EXISTS "Allow admin full access to courses" ON public.courses;
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Allow admin full access to settings" ON public.platform_settings;

-- 5. RLS Policies
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to courses" ON public.courses FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to settings" ON public.platform_settings FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin full access to categories" ON public.categories FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Allow admin full access to courses" ON public.courses FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "Allow admin full access to settings" ON public.platform_settings FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- 6. Insert Default Platform Settings
INSERT INTO public.platform_settings (id, homepage_category_mode) 
VALUES ('00000000-0000-0000-0000-000000000000', 'default')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Initial Categories
INSERT INTO public.categories (id, name, slug, icon_name, show_on_homepage) VALUES
  ('a1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f', 'Bangla Medium', 'bangla-medium', 'BookOpen', true),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'English Medium', 'english-medium', 'Globe', true),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Admission Test', 'admission-test', 'Target', true),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Skill Dev', 'skill-dev', 'Briefcase', true),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Religious Studies', 'religious-studies', 'Heart', true),
  ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Arts & Crafts', 'arts-crafts', 'PlayCircle', true),
  ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'Language', 'language', 'Quote', true),
  ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'Test Prep', 'test-prep', 'Award', true)
ON CONFLICT (name) DO UPDATE 
SET icon_name = EXCLUDED.icon_name, show_on_homepage = EXCLUDED.show_on_homepage;

-- 8. Seed Initial Courses (Classes)
INSERT INTO public.courses (category_id, name, slug, is_popular) VALUES
  -- Bangla Medium
  ('a1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f', 'Class 8', 'class-8', false),
  ('a1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f', 'Class 9', 'class-9', false),
  ('a1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f', 'Class 10', 'class-10', true),
  ('a1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f', 'SSC', 'ssc', true),
  ('a1e2f3a4-b5c6-4d7e-8f90-1a2b3c4d5e6f', 'HSC', 'hsc', true),
  -- English Medium
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'O Level', 'o-level', true),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'A Level', 'a-level', true),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Class 5', 'class-5', false),
  -- Admission Test
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'University Admission', 'university-admission', true),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Medical Admission', 'medical-admission', true),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'BUET Admission', 'buet-admission', true),
  -- Skill Dev
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Web Development', 'web-development', true),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Graphic Design', 'graphic-design', false),
  -- Religious Studies
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Quran Reading', 'quran-reading', true),
  ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Islamic History', 'islamic-history', false),
  -- Arts & Crafts
  ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Fine Arts', 'fine-arts', false),
  ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Music', 'music', false),
  -- Language
  ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'IELTS Prep', 'ielts-prep', true),
  ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'Spoken English', 'spoken-english', true),
  -- Test Prep
  ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'GRE', 'gre', false),
  ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'SAT', 'sat', true)
ON CONFLICT (category_id, name) DO NOTHING;
