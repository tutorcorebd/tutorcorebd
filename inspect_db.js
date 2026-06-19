import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log("Supabase URL:", supabaseUrl);
  
  // Try fetching one user to see their structure
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  console.log("Users sample:", userData ? Object.keys(userData[0] || {}) : null, "Error:", userError);

  // Try fetching one tutor_profile
  const { data: tutorData, error: tutorError } = await supabase
    .from('tutor_profiles')
    .select('*')
    .limit(1);
    
  console.log("Tutor profiles sample:", tutorData ? Object.shapes ? Object.keys(tutorData[0] || {}) : null : null, "Error:", tutorError);
  
  // Try fetching membership requests
  const { data: memData, error: memError } = await supabase
    .from('membership_requests')
    .select('*')
    .limit(1);
    
  console.log("Membership requests sample:", memData ? Object.keys(memData[0] || {}) : null, "Error:", memError);
}

inspect();
