/// <reference types="vite/client" />

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function notConfiguredError(): never {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
}

let supabase: SupabaseClient<any, any, any>;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  // Minimal no-op client to allow the app to run without env vars
  supabase = {
    auth: {
      async getSession() { return { data: { session: null }, error: null } as any; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } as any; },
      async signInWithPassword() { return notConfiguredError(); },
      async signUp() { return notConfiguredError(); },
      async signInWithOtp() { return notConfiguredError(); },
      async signOut() { return { error: null } as any; },
    } as any,
    from() {
      return {
        async select() { return { data: [], error: null }; },
      } as any;
    },
    storage: {
      from() {
        return {
          async upload() { return notConfiguredError(); },
          getPublicUrl() { return { data: { publicUrl: '' }, error: null } as any; },
          async remove() { return notConfiguredError(); },
          async list() { return notConfiguredError(); },
        } as any;
      },
    } as any,
  } as any;
}

export default supabase;
export { supabaseUrl, supabaseKey };
