import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function requiredPublicEnv(name: string, rawValue: string | undefined) {
  const value = rawValue?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function getClient(): SupabaseClient {
  if (!_client) {
    // Next.js only exposes browser variables referenced with static property access.
    const url = requiredPublicEnv(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    )
    const anonKey = requiredPublicEnv(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )

    try {
      new URL(url)
    } catch {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    }

    _client = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    })
  }
  return _client
}

export const supabase = {
  get auth() { return getClient().auth },
  from: (...args: Parameters<SupabaseClient['from']>) => getClient().from(...args),
  channel: (...args: Parameters<SupabaseClient['channel']>) => getClient().channel(...args),
  removeChannel: (...args: Parameters<SupabaseClient['removeChannel']>) => getClient().removeChannel(...args),
}
