import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Werwolf',
  description: 'Das klassische Werwolf-Spiel – jetzt im Browser',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-dvh flex flex-col antialiased">{children}</body>
    </html>
  )
}
