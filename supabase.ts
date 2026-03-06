
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim() !== '') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://eictllkckjlkqmejvqum.supabase.co';

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== '')
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpY3RsbGtja2psa3FtZWp2cXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDgzMDAsImV4cCI6MjA4Nzc4NDMwMH0.QfMJqnu-ecSn3Yu-wX45dJ73MMK9lMKhKIZSk12OwiQ';

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
