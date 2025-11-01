import { supabaseDataProvider } from "ra-supabase-core";
import { supabase } from "./supabase";

export const dataProvider = supabaseDataProvider({
  instanceUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabase,
  primaryKeys: new Map([
    ['Server', ['guildId']]
  ])
});
