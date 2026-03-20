const { createClient } = require('@supabase/supabase-js');
const url = 'https://creteaebjohsohwfxrrw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZXRlYWViam9oc29od2Z4cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzYzNDEsImV4cCI6MjA4OTMxMjM0MX0.HNe1oRZ_lxWD60Rj3XEf4Uh40K3maTiYRs8C9J6Dw6E';
const s = createClient(url, key);

async function check() {
  const { data, error } = await s.from('bookings').select('*, rooms(room_name), users(full_name)').limit(1);
  if (error) console.error('Error:', error);
  else console.log('Join Result:', data[0]);
}
check();
