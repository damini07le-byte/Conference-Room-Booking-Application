import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wxtbmlmddmtrarrtczzy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dGJtbG1kZG10cmFycnRjenp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTQ4MjUsImV4cCI6MjA4OTIzMDgyNX0.A4mnIrmTGQkG86A7-DbjSS31lc9I11v79MRcMENydPc';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
