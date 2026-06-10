'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateGuestName, generateLobbyCode } from '@/lib/roleAssignment'
import { saveName, loadName, saveLobby, saveMyPlayer } from '@/lib/storage'
import { getAutoConfig, getTotalRoles } from '@/lib/autoConfig'
import { subscribeToLobby, BroadcastMsg } from '@/lib/broadcast'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState<'create' | 'join' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null)

  useEffect(() => {
    const cached = loadName()
    setName(cached || generateGuestName())
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const n = data.user.user_metadata?.full_name ?? data.user.email ?? ''
        setUser({ id: data.user.id, email: data.user.email, name: n })
        if (!loadName()) setName(n)
      }
    })
  }, [])

  function handleNameChange(n: string) {
    setName(n)
    saveName(n)
  }

  async function loginWithGoogle() {
    setLoading('google')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setName(generateGuestName())
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

    // Subscribe and wait for lobby_state from admin
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

    // Ask admin to send current state
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

        {user ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-gray-500 text-xs">{user.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 text-xs hover:text-white transition-colors">Abmelden</button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 rounded-2xl font-semibold text-sm active:scale-95 transition-all disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Mit Google anmelden
          </button>
        )}

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
