import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://creteaebjohsohwfxrrw.supabase.co';
// Using the Service Role Key to bypass auth rate limits
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZXRlYWViam9oc29od2Z4cnJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzczNjM0MSwiZXhwIjoyMDg5MzEyMzQxfQ.WjFYrbiEavdmtORabGab7SZxoRXo4IfeVYBEtmvEszc';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdminUser(email, password, profileData) {
    console.log(`\nSetting up ${profileData.role} user: ${email}`);
    
    // 1. Create User using Admin API (Bypasses email rate limits and sets email_confirm: true automatically)
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    if (adminError) {
        if (adminError.message.includes("already registered")) {
            console.log(`⚠️ User already exists in Auth. Please delete from Supabase Auth dashboard if you want to recreate.`);
            return;
        } else {
            console.error(`❌ Admin Auth creation failed:`, adminError.message);
            return;
        }
    }

    if (adminData?.user) {
        console.log(`✅ Auth User created successfully. ID: ${adminData.user.id}`);
        
        // 2. Insert into public.users table (Profile)
        console.log(`Inserting profile into public.users...`);
        const { error: profileError } = await supabase.from('users').insert([{
            user_id: adminData.user.id,
            email: email,
            full_name: profileData.full_name,
            department: profileData.department,
            role: profileData.role
        }]);

        if (profileError) {
            console.error(`❌ Profile insertion error:`, profileError.message);
        } else {
            console.log(`🎉 Success! Profile created in the public.users table.`);
        }
    }
}

async function main() {
    await createAdminUser('admin@pucho.ai', 'admin123', {
        full_name: 'Pucho Admin',
        department: 'Management',
        role: 'ADMIN'
    });

    await createAdminUser('user@pucho.ai', 'user123', {
        full_name: 'Pucho User',
        department: 'Engineering',
        role: 'EMPLOYEE'
    });
}

main();
