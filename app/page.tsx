'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { generateGuestName, generateLobbyCode } from '@/lib/roleAssignment'
import { saveName, loadName, saveLobby, saveMyPlayer } from '@/lib/storage'
import { getAutoConfig } from '@/lib/autoConfig'
import { subscribeToLobby, BroadcastMsg } from '@/lib/broadcast'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState<'create' | 'join' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const cached = loadName()
    setName(cached || generateGuestName())
  }, [])

  function handleNameChange(n: string) {
    setName(n)
    saveName(n)
  }

  async function createLobby() {
    if (!name.trim()) return
    setLoading('create')
    setError('')
    const code = generateLobbyCode()
    const playerId = crypto.randomUUID()
    const playerName = name.trim()

    const config = getAutoConfig(1)
    const settings = { votesVisible: true, mayorEnabled: true, autoConfig: false }

    saveLobby({ code, config, settings, players: [{ id: playerId, name: playerName, isAdmin: true }] })
    saveMyPlayer(code, { id: playerId, name: playerName, isAdmin: true })
    saveName(playerName)

    router.push(`/lobby/${code}`)
  }

  async function joinLobby() {
    const code = joinCode.trim().toUpperCase()
    if (!code || !name.trim()) return
    setLoading('join')
    setError('')

    const playerId = crypto.randomUUID()
    const playerName = name.trim()

    let channel: RealtimeChannel | null = null
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        channel?.unsubscribe()
        setError('Keine Lobby mit diesem Code gefunden')
        setLoading(null)
      }
    }, 8000)

    channel = subscribeToLobby(code, (msg: BroadcastMsg) => {
      if (resolved) return
      if (msg.type === 'lobby_state') {
        resolved = true
        clearTimeout(timeout)
        channel?.unsubscribe()

        const lobby = msg.payload
        const updatedPlayers = [...lobby.players, { id: playerId, name: playerName, isAdmin: false }]
        saveLobby({ ...lobby, players: updatedPlayers })
        saveMyPlayer(code, { id: playerId, name: playerName, isAdmin: false })
        saveName(playerName)
        router.push(`/lobby/${code}`)
      }
    })

    setTimeout(() => {
      supabase.channel(`werwolf:${code}`).send({
        type: 'broadcast', event: 'msg',
        payload: { type: 'request_sync' },
      })
    }, 500)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-dvh px-4 py-8">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <div className="text-6xl">🐺</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">WERWOLF</h1>
          <p className="text-gray-500 text-sm">Das Dorf erwacht. Wer ist der Wolf?</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Dein Name</label>
          <input
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Name eingeben..."
            maxLength={20}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={createLobby}
            disabled={!name.trim() || !!loading}
            className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-50"
          >
            {loading === 'create' ? 'Erstelle...' : 'Lobby erstellen'}
          </button>

          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Code (z.B. WR7X2K)"
              maxLength={6}
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/40 transition-colors uppercase tracking-widest text-center"
            />
            <button
              onClick={joinLobby}
              disabled={!joinCode.trim() || !name.trim() || !!loading}
              className="px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-semibold active:scale-95 transition-all disabled:opacity-50"
            >
              {loading === 'join' ? '...' : '→'}
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
