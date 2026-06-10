import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Werwolf',
    short_name: 'Werwolf',
    description: 'Das klassische Werwolf-Spiel im Browser',
    start_url: '/',
    display: 'standalone',
    background_color: '#08080f',
    theme_color: '#08080f',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg',     sizes: 'any',      type: 'image/svg+xml' },
    ],
  }
}
