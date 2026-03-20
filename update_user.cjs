const { createClient } = require('@supabase/supabase-js');
const url = 'https://creteaebjohsohwfxrrw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZXRlYWViam9oc29od2Z4cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzYzNDEsImV4cCI6MjA4OTMxMjM0MX0.HNe1oRZ_lxWD60Rj3XEf4Uh40K3maTiYRs8C9J6Dw6E';
const s = createClient(url, key);

async function run() {
  const { data, error } = await s
    .from('users')
    .update({ 
      email: 'damini07.le@gmail.com', 
      full_name: 'Damini Patil' 
    })
    .eq('user_id', '8d70cabf-407e-4f00-953c-7379df68e208');
  
  if (error) {
    console.error('Update Error:', error);
  } else {
    console.log('Profile successfully updated to Damini Patil (damini07.le@gmail.com)');
  }
}
run();
