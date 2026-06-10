'use client'
import { useEffect } from 'react'

export default function ChunkErrorHandler() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      const msg = event.message ?? ''
      if (msg.includes('Failed to load chunk') || msg.includes('ChunkLoadError') || msg.includes('Loading chunk')) {
        window.location.reload()
      }
    }
    window.addEventListener('error', onError)
    return () => window.removeEventListener('error', onError)
  }, [])
  return null
}
