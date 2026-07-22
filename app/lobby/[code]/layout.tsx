import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Private lobby',
  description: 'A private Werewolf lobby shared directly with invited players.',
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

export default function PrivateLobbyLayout({ children }: { children: React.ReactNode }) {
  return children
}
