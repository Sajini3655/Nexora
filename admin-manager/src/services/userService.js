import { supabase } from "../supabaseClient";

export async function createUser(fullName, email, role) {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        full_name: fullName,
        email: email,
        role: role,
        status: "INVITED"
      }
    ])
    .select();

  return { data, error };
}
