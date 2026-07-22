import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/PWARegister'
import ChunkErrorHandler from '@/components/ChunkErrorHandler'
import MotionAtmosphere from '@/components/MotionAtmosphere'
import { LanguageProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/ThemeProvider'
import { DEFAULT_THEME, THEME_BOOTSTRAP_SCRIPT, THEME_COLOR } from '@/lib/theme'
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALE_DIRECTION,
  translate,
} from '@/lib/i18n/translations'
import { resolveSiteUrl } from '@/lib/site-url'

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: {
    default: translate(DEFAULT_LOCALE, 'metadata.title'),
    template: `%s · ${translate(DEFAULT_LOCALE, 'metadata.title')}`,
  },
  applicationName: translate(DEFAULT_LOCALE, 'common.appName'),
  description: translate(DEFAULT_LOCALE, 'metadata.description'),
  category: 'game',
  keywords: ['Werewolf', 'social game', 'party game', 'browser game'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: translate(DEFAULT_LOCALE, 'common.appName'),
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/icon.svg',
    apple: [{ url: '/icons/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  themeColor: THEME_COLOR[DEFAULT_THEME],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={HTML_LANG[DEFAULT_LOCALE]}
      dir={LOCALE_DIRECTION[DEFAULT_LOCALE]}
      className="h-full"
      data-theme={DEFAULT_THEME}
      data-scroll-behavior="smooth"
      /* The bootstrap script rewrites data-theme before hydration. */
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <ChunkErrorHandler />
        <PWARegister />
        <MotionAtmosphere />
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
