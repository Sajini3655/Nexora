import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wmrlgibwjpxotxwtwgvx.supabase.co";
const supabaseKey = "sb_publishable_zYfJitNVE61pcNIi4vT0vQ_ECcLDMZt";

export const supabase = createClient(supabaseUrl, supabaseKey);