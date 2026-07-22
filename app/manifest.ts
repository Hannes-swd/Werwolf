import type { MetadataRoute } from 'next'
import { DEFAULT_LOCALE, HTML_LANG, translate } from '@/lib/i18n/translations'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: translate(DEFAULT_LOCALE, 'common.appName'),
    short_name: translate(DEFAULT_LOCALE, 'common.appName'),
    description: translate(DEFAULT_LOCALE, 'metadata.description'),
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f7f9',
    theme_color: '#f6f7f9',
    lang: HTML_LANG[DEFAULT_LOCALE],
    categories: ['games', 'entertainment'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
