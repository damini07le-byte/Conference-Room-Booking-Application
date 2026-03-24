import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [key, ...valueParts] = line.split('=');
            return [key.trim(), valueParts.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase credentials missing in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    console.log("Fetching existing users from 'public.users'...");
    
    const { data, error } = await supabase
        .from('users')
        .select('user_id, email, full_name, role, department')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching users:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log("\n[RESULT]: No users found. Table is clean! ✅");
    } else {
        console.log(`\n[RESULT]: Found ${data.length} users:`);
        console.table(data);
    }
}

listUsers();
