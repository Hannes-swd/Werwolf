'use client'
import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations()
        .then(registrations => {
          registrations.forEach(registration => void registration.unregister())
        })
        .catch(() => {
          // Stale workers do not block local development.
        })
      return
    }

    void navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    }).catch(() => {
      // The app still works online when registration fails.
    })
  }, [])
  return null
}
