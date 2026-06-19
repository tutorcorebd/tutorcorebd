import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testReadSystem() {
  const { data: tData, error: tErr } = await supabase.from('information_schema.triggers').select('*');
  console.log("information_schema.triggers:", { tData, tErr });
  
  const { data: pData, error: pErr } = await supabase.from('pg_trigger').select('*');
  console.log("pg_trigger:", { pData, pErr });
}

testReadSystem();
