import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Supabase Connected Successfully');
    console.log('Session data:', data);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Supabase Connection Error:', error.message);
    } else {
      console.error('❌ Supabase Connection Error:', error);
    }
  }
})();