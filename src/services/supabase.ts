
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim() !== '') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://tyvbdejhhihvgzwdpuia.supabase.co';

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== '')
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmJkZWpoaGlodmd6d2RwdWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MjIzMTQsImV4cCI6MjA4ODQ5ODMxNH0.2Lwd0k82Mq8AEG0e0OmnFeBFUZVfda141UG9vbXO98Y';

console.log('Supabase URL:', supabaseUrl);
if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.trim() === '') {
  console.warn('VITE_SUPABASE_URL is missing or empty in environment, using fallback.');
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY.trim() === '') {
  console.warn('VITE_SUPABASE_ANON_KEY is missing or empty in environment, using fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get public URL for storage
export const getStorageUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
