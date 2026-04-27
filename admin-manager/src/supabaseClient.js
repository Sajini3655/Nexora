import { createClient } from "@supabase/supabase-js";

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  envSupabaseUrl ||
  "https://wmrlgibwjpxotxwtwgvx.supabase.co";

const supabaseAnonKey =
  envSupabaseAnonKey ||
  "sb_publishable_zYfJitNVE61pcNIi4vT0vQ_ECcLDMZt";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Configuration is considered valid only when explicit Vite env variables are set.
export const isSupabaseConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey);

