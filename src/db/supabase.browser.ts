import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client for browser/client-side usage
 * This is needed to handle auth tokens from URL fragments (e.g., password reset)
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY
  );
}

