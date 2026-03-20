const { createClient } = require('@supabase/supabase-js');
const url = 'https://creteaebjohsohwfxrrw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZXRlYWViam9oc29od2Z4cnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MzYzNDEsImV4cCI6MjA4OTMxMjM0MX0.HNe1oRZ_lxWD60Rj3XEf4Uh40K3maTiYRs8C9J6Dw6E';
const s = createClient(url, key);

async function check() {
  const { data, error } = await s.from('bookings').select('attendee_emails, user_email');
  if (error) console.error(error);
  else {
    const emails = new Set();
    data.forEach(b => {
      if (b.user_email) emails.add(b.user_email);
      if (b.attendee_emails) b.attendee_emails.split(',').forEach(e => emails.add(e.trim()));
    });
    console.log('All found emails:', Array.from(emails));
  }
}
check();
