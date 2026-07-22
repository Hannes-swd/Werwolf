import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Private game',
  description: 'A private Werewolf game shared directly with its players.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-image-preview': 'none',
      'max-snippet': 0,
      'max-video-preview': 0,
    },
  },
}

export default function PrivateGameLayout({ children }: { children: React.ReactNode }) {
  return children
}
