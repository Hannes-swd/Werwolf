import type { MetadataRoute } from 'next'
import { absoluteSiteUrl } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteSiteUrl('/'),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
