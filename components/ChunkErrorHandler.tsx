'use client'
import { useEffect } from 'react'

const RELOAD_KEY = 'werwolf_chunk_reload'

export default function ChunkErrorHandler() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      const msg = event.message ?? ''
      const isChunkError = msg.includes('Failed to load chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk')
      if (!isChunkError) return

      // Reload once to pick up a fresh deployment without creating a loop.
      try {
        const lastReload = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? 0)
        if (Date.now() - lastReload < 30_000) return
        window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      } catch {
        // Storage can be blocked in hardened browser modes; one reload is safe.
      }
      window.location.reload()
    }
    window.addEventListener('error', onError)
    return () => window.removeEventListener('error', onError)
  }, [])
  return null
}
