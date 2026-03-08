import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tyvbdejhhihvgzwdpuia.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmJkZWpoaGlodmd6d2RwdWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjIzMTQsImV4cCI6MjA4ODQ5ODMxNH0.2Lwd0k82Mq8AEG0e0OmnFeBFUZVfda141UG9vbXO98Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
