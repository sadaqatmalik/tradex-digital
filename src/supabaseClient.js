import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dkfrizvsjityzwdjmgax.supabase.co";

const supabaseAnonKey =  "sb_publishable_HhFjcv_LHgd9hEKplJ84yQ_w5YI9Cf1";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);
