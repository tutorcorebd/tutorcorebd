import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data: users, error } = await supabase
    .from('users')
    .select('role')
    .limit(100);
    
  console.log("Users roles list:", users);
  console.log("Error if any:", error);

  const testId = '11111111-1111-1111-1111-111111111111';
  
  // Try clean up first
  await supabase.from('users').delete().eq('id', testId);

  // Try inserting as tutor
  const { error: tutorInsertErr } = await supabase
    .from('users')
    .insert([{
      id: testId,
      role: 'tutor',
      full_name: 'Test Tutor',
      email: 'test_tutor@example.com',
      status: 'active'
    }]);
  console.log("Insert tutor error:", tutorInsertErr?.message || "SUCCESS");

  // Delete again
  await supabase.from('users').delete().eq('id', testId);

  // Try inserting as guardian
  const { error: guardianInsertErr } = await supabase
    .from('users')
    .insert([{
      id: testId,
      role: 'guardian',
      full_name: 'Test Guardian',
      email: 'test_guardian@example.com',
      status: 'active'
    }]);
  console.log("Insert guardian error:", guardianInsertErr?.message || "SUCCESS");
  
  // Try inserting as parents
  const { error: parentsInsertErr } = await supabase
    .from('users')
    .insert([{
      id: testId,
      role: 'parents',
      full_name: 'Test Parents',
      email: 'test_parents@example.com',
      status: 'active'
    }]);
  console.log("Insert parents error:", parentsInsertErr?.message || "SUCCESS");

  // Clean up
  await supabase.from('users').delete().eq('id', testId);
}

inspect();
