const LOCAL_SITE_URL = 'http://localhost:3000'

type SiteEnvironment = Record<string, string | undefined>

function parseSiteUrl(value: string | undefined) {
  if (!value?.trim()) return null

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (url.username || url.password) return null

    url.pathname = '/'
    url.search = ''
    url.hash = ''
    return url
  } catch {
    return null
  }
}

export function resolveSiteUrl(environment: SiteEnvironment = process.env) {
  const candidates = [
    environment.NEXT_PUBLIC_SITE_URL,
    environment.SITE_URL,
    environment.VERCEL_PROJECT_PRODUCTION_URL,
    environment.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const url = parseSiteUrl(candidate)
    if (url) return url
  }

  return new URL(LOCAL_SITE_URL)
}

export function absoluteSiteUrl(pathname = '/') {
  return new URL(pathname, resolveSiteUrl()).href
}
