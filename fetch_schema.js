import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';

async function fetchSchema() {
  console.log("Fetching schema from:", supabaseUrl);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': fs.readFileSync('.env.local', 'utf8').match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim(),
      }
    });
    const text = await res.text();
    console.log("Response text:", text.slice(0, 1000));
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}

fetchSchema();
