import { describe, expect, it } from 'vitest'
import { resolveSiteUrl } from '@/lib/site-url'

describe('site URL resolution', () => {
  it('prefers the configured canonical origin', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://play.example.com/path?x=1' }).href).toBe(
      'https://play.example.com/',
    )
  })

  it('normalizes trusted deployment hostnames', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'werewolf.example.com' }).href).toBe(
      'https://werewolf.example.com/',
    )
  })

  it('rejects unsafe URLs and uses a local development origin', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'javascript:alert(1)' }).href).toBe(
      'http://localhost:3000/',
    )
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://user:pass@example.com' }).href).toBe(
      'http://localhost:3000/',
    )
  })
})
