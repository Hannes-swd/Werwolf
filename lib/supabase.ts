import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

export const supabase = {
  get auth() { return getClient().auth },
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
  channel: (name: string) => getClient().channel(name),
  removeChannel: (...args: Parameters<SupabaseClient['removeChannel']>) => getClient().removeChannel(...args),
}
