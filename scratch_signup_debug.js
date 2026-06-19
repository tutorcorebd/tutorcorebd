import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const email = `test_guardian_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log("Testing auth.signUp as guardian with email:", email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {}
    }
  });

  console.log("Signup returned data:", data);
  console.log("Signup returned error:", error);
}

testSignup();
