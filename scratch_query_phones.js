import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCheck() {
  const { data: phone1, error: err1 } = await supabase.from('users').select('*').eq('phone_number', '01514646848');
  console.log("Check phone 01514646848:", phone1, err1);

  const { data: phone2, error: err2 } = await supabase.from('users').select('*').eq('phone_number', '01778787878');
  console.log("Check phone 01778787878:", phone2, err2);
}

testCheck();
