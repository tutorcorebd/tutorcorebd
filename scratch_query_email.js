import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCheckEmail() {
  const { data, error } = await supabase.from('users').select('*').eq('email', 'zuabiggxjweyttmssq@onldm.net');
  console.log("Check email zuabiggxjweyttmssq@onldm.net in users:", data, error);
}

testCheckEmail();
