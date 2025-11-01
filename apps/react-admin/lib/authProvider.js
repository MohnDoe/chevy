import { supabaseAuthProvider } from "ra-supabase-core";
import { supabase } from "./supabase";

export const authProvider = supabaseAuthProvider(supabase, {
  getIdentity: async (user) => {
    const { data, error } = await supabase
      .from("userProfiles")
      .select("id, first_name, last_name")
      .match({ email: user.email })
      .single();

    if (!data || error) {
      throw new Error();
    }

    return {
      id: data.id,
      fullName: `${data.first_name} ${data.last_name}`,
    };
  },
});
