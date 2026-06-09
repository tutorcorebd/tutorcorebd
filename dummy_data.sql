-- Enable pgcrypto for password hashing if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a Guardian User in auth.users
WITH guardian_insert AS (
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'guardian@test.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"full_name": "Test Guardian", "role": "guardian", "phone_number": "01700000001"}', NOW(), NOW()
  ) RETURNING id
),
-- 2. Create a Tutor User in auth.users
tutor_insert AS (
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tutor@test.com',
    crypt('password123', gen_salt('bf')), NOW(),
    '{"full_name": "Test Tutor", "role": "tutor", "phone_number": "01800000002"}', NOW(), NOW()
  ) RETURNING id
)

-- 3. Insert Dummy Tuition Requests for the Guardian
-- Note: The trigger "on_auth_user_created" (from the schema) will automatically 
-- create the public.users and public.tutor_profiles rows when the CTEs above run.
INSERT INTO public.tuition_requests (guardian_id, student_class, subject, location, guardian_whatsapp, salary_range, days_per_week, status)
SELECT 
  id, 'Class 10', ARRAY['Math', 'Physics', 'Chemistry'], 'Dhanmondi, Dhaka', '01700000001', '5000-8000 BDT', 4, 'open'
FROM guardian_insert
UNION ALL
SELECT 
  id, 'HSC 2nd Year', ARRAY['English', 'ICT'], 'Gulshan, Dhaka', '01700000001', '8000-12000 BDT', 3, 'open'
FROM guardian_insert
UNION ALL
SELECT 
  id, 'Class 8', ARRAY['All Subjects'], 'Mirpur, Dhaka', '01700000001', '4000-6000 BDT', 5, 'open'
FROM guardian_insert;

-- Note:
-- You can now login to the web app using:
-- Guardian Email: guardian@test.com | Password: password123
-- Tutor Email: tutor@test.com | Password: password123
