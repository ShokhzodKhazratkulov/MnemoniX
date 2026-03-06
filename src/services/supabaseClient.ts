/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
};

/**
 * Uploads a base64 image to Supabase Storage
 */
export const uploadBase64 = async (base64: string, bucket: string, path: string, contentType: string = 'image/png') => {
  try {
    console.log(`Uploading to bucket: ${bucket}, path: ${path}`);
    // Remove the data:image/png;base64, prefix if it exists
    const parts = base64.split(',');
    const base64Data = parts.length > 1 ? parts[1] : parts[0];
    
    // Convert base64 to Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error(`Supabase storage upload error for bucket ${bucket}:`, error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`Upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error('Error in uploadBase64:', err);
    throw err;
  }
};
