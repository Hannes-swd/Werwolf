import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'
import { DEFAULT_LOCALE, translate } from '@/lib/i18n/translations'
import { resolveSiteUrl } from '@/lib/site-url'

const title = translate(DEFAULT_LOCALE, 'metadata.title')
const description = translate(DEFAULT_LOCALE, 'metadata.description')

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: '/',
    title,
    description,
    siteName: title,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

function StructuredData() {
  const siteUrl = resolveSiteUrl().href
  const supportedLanguages = ['en', 'de', 'es', 'fr', 'it', 'pt', 'zh-CN', 'ja', 'ko', 'ar']
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        url: siteUrl,
        name: title,
        description,
        inLanguage: supportedLanguages,
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}#application`,
        url: siteUrl,
        name: title,
        description,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript and a modern web browser.',
        isAccessibleForFree: true,
        inLanguage: supportedLanguages,
        genre: ['Party game', 'Social deduction game'],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  )
}

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <HomePageClient />
      <noscript>
        <section className="ww-noscript" aria-labelledby="no-script-title">
          <h2 id="no-script-title">Play Werewolf together in your browser</h2>
          <p>
            Create a private lobby, share its six-character code, and guide your group through the
            classic social deduction game. No account or installation is needed.
          </p>
          <p>
            JavaScript is required for live rooms, private roles, voting, and realtime updates.
            Enable it, then reload this page to start a game.
          </p>
        </section>
      </noscript>
    </>
  )
}
