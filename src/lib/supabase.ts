import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
