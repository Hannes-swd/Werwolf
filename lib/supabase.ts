import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Lazy browser client – safe to import in client components
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// Named export alias used across client components
export const supabase = {
  get auth() { return getSupabase().auth },
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabase().from(...args),
  channel: (...args: Parameters<SupabaseClient['channel']>) => getSupabase().channel(...args),
  removeChannel: (...args: Parameters<SupabaseClient['removeChannel']>) => getSupabase().removeChannel(...args),
}

// Server-side service-role client (API routes only)
export function createServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
