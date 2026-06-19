import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignupDetailed() {
  const email = `test_guardian_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log("Testing detailed auth.signUp with email:", email);
  
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          full_name: 'Test Guardian',
          phone_number: '1234567890',
          role: 'guardian'
        }
      })
    });
    
    const status = res.status;
    const text = await res.text();
    console.log("Response Status:", status);
    console.log("Response Text:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testSignupDetailed();
