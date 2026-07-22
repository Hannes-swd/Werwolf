import type { MetadataRoute } from 'next'
import { absoluteSiteUrl, resolveSiteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: absoluteSiteUrl('/sitemap.xml'),
    host: resolveSiteUrl().origin,
  }
}
