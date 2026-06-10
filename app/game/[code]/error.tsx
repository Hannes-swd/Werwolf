'use client'
import { useEffect } from 'react'

export default function GameError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[GamePage] React error boundary caught:', error.message, error.stack)
  }, [error])

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6 text-center">
      <p className="text-red-400 font-semibold">Fehler im Spiel</p>
      <p className="text-gray-500 text-sm font-mono break-all">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold active:scale-95"
      >
        Neu laden
      </button>
    </main>
  )
}
