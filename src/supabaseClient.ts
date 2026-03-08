import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'undefined') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://tyvbdejhhihvgzwdpuia.supabase.co';

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'undefined') 
  ? import.meta.env.VITE_SUPABASE_ANON_KEY 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmJkZWpoaGlodmd6d2RwdWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjIzMTQsImV4cCI6MjA4ODQ5ODMxNH0.2Lwd0k82Mq8AEG0e0OmnFeBFUZVfda141UG9vbXO98Y';

if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'undefined') {
  console.warn("Supabase URL not found in environment variables. Using fallback. If you are on mnemonix.io, please ensure VITE_SUPABASE_URL is set in your hosting provider's dashboard.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
