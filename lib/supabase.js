import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);

// Public client — limited access, used for auth token verification
export const supabase = isSupabaseConfigured
  ? createClient(url, key)
  : null;

// Service client — full access, used server-side only.
// The 'server-only' import makes the build fail if this module is ever
// accidentally bundled into client code, preventing the service key from leaking.
import 'server-only';

export const supabaseAdmin = isSupabaseConfigured && serviceKey
  ? createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
