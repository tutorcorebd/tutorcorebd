import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const email = `test_tutor_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log("Testing auth.signUp as tutor with email:", email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Test Tutor',
        phone_number: '1234567890',
        role: 'tutor'
      }
    }
  });

  console.log("Signup returned data:", data);
  console.log("Signup returned error:", error);
}

testSignup();
