import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWARegister from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'Werwolf',
  description: 'Das klassische Werwolf-Spiel im Browser',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Werwolf',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#08080f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-dvh flex flex-col antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
