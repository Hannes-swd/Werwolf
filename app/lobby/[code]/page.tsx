'use client'

import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import {
  Check,
  Copy,
  Crown,
  LoaderCircle,
  LogOut,
  Radio,
  Share2,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import {
  LobbyState,
  loadLobby,
  saveLobby,
  loadMyPlayer,
  saveGameState,
  makeEmptyRound,
} from '@/lib/storage'
import { broadcastGame, broadcastLobby, subscribeToLobby, BroadcastMsg } from '@/lib/broadcast'
import { isValidRoleSetup, startGame } from '@/lib/gameEngine'
import AdminPanel from '@/components/AdminPanel'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { RoleConfig } from '@/types/game'
import { getAutoConfig } from '@/lib/autoConfig'
import { useT, type TranslationKey } from '@/lib/i18n'

type MyPlayer = NonNullable<ReturnType<typeof loadMyPlayer>>

function fitConfigToPlayerCount(config: RoleConfig, playerCount: number, useAutoConfig: boolean): RoleConfig {
  if (useAutoConfig) return getAutoConfig(playerCount)
  const specialCount = Object.entries(config)
    .filter(([role]) => role !== 'villager')
    .reduce((sum, [, count]) => sum + count, 0)
  return { ...config, villager: Math.max(0, playerCount - specialCount) }
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('clipboard-unavailable')
}

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const t = useT()
  const rootRef = useRef<HTMLElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sharedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lobby, setLobby] = useState<LobbyState | null>(null)
  const [me, setMe] = useState<MyPlayer | null>(null)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  const [noticeKey, setNoticeKey] = useState<TranslationKey | null>(null)

  const isAdmin = me?.isAdmin ?? false
  const playerKey = lobby?.players.map(player => player.id).join('|') ?? ''
  const lobbyReady = Boolean(lobby && me)

  useEffect(() => {
    let channel: ReturnType<typeof subscribeToLobby> | null = null
    let syncPoll: ReturnType<typeof setInterval> | null = null
    let arrivalTimer: ReturnType<typeof setTimeout> | null = null
    let active = true

    const initializeTimer = setTimeout(() => {
      if (!active) return
      const currentPlayer = loadMyPlayer(code)
      if (!currentPlayer) {
        router.replace('/')
        return
      }

      setMe(currentPlayer)
      const storedLobby = loadLobby(code)
      if (storedLobby) setLobby(storedLobby)

      channel = subscribeToLobby(code, (message: BroadcastMsg) => {
        if (message.type === 'lobby_state') {
          // The host owns the canonical lobby and never accepts a client snapshot.
          if (currentPlayer.isAdmin) return
          const localLobby = loadLobby(code)
          if (!localLobby) return
          const ownEntry = localLobby.players.find(player => player.id === currentPlayer.id)
          const others = message.payload.players.filter(player => player.id !== currentPlayer.id)
          const mergedPlayers = ownEntry ? [ownEntry, ...others] : message.payload.players
          const merged: LobbyState = {
            ...message.payload,
            players: mergedPlayers,
            config: fitConfigToPlayerCount(
              message.payload.config,
              mergedPlayers.length,
              message.payload.settings.autoConfig,
            ),
          }
          saveLobby(merged)
          setLobby(merged)
        }

        if (message.type === 'game_state') {
          saveGameState(message.payload)
          window.location.assign(`/game/${code}`)
        }

        if (message.type === 'request_sync' && currentPlayer.isAdmin) {
          const localLobby = loadLobby(code)
          if (!localLobby) return
          const joiningPlayer = message.payload?.joiningPlayer
          if (joiningPlayer && !localLobby.players.some(player => player.id === joiningPlayer.id)) {
            const players = [...localLobby.players, { id: joiningPlayer.id, name: joiningPlayer.name, isAdmin: false }]
            const updated: LobbyState = {
              ...localLobby,
              players,
              config: fitConfigToPlayerCount(localLobby.config, players.length, localLobby.settings.autoConfig),
            }
            saveLobby(updated)
            setLobby(updated)
            if (channelRef.current) void broadcastLobby(channelRef.current, updated)
          } else {
            if (channelRef.current) void broadcastLobby(channelRef.current, localLobby)
          }
        }

        if (message.type === 'player_joined' && currentPlayer.isAdmin) {
          const localLobby = loadLobby(code)
          if (!localLobby || localLobby.players.some(player => player.id === message.payload.id)) return
          const players = [...localLobby.players, { id: message.payload.id, name: message.payload.name, isAdmin: false }]
          const updated: LobbyState = {
            ...localLobby,
            players,
            config: fitConfigToPlayerCount(localLobby.config, players.length, localLobby.settings.autoConfig),
          }
          saveLobby(updated)
          setLobby(updated)
          if (channelRef.current) void broadcastLobby(channelRef.current, updated)
        }

        if (message.type === 'kicked' && message.payload.playerId === currentPlayer.id) {
          router.replace('/?kicked=1')
        }
        if (message.type === 'lobby_closed') router.replace('/?closed=1')
      }, currentPlayer.id)
      channelRef.current = channel

      if (!currentPlayer.isAdmin) {
        arrivalTimer = setTimeout(() => {
          void channelRef.current?.send({
            type: 'broadcast',
            event: 'msg',
            payload: { type: 'player_joined', payload: { id: currentPlayer.id, name: currentPlayer.name } },
          })
        }, 400)

        syncPoll = setInterval(() => {
          void channelRef.current?.send({
            type: 'broadcast',
            event: 'msg',
            payload: { type: 'request_sync' },
          })
        }, 2000)
      }
    }, 0)

    return () => {
      active = false
      clearTimeout(initializeTimer)
      if (arrivalTimer) clearTimeout(arrivalTimer)
      if (syncPoll) clearInterval(syncPoll)
      if (channel) supabase.removeChannel(channel)
      if (channelRef.current === channel) channelRef.current = null
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      if (sharedTimerRef.current) clearTimeout(sharedTimerRef.current)
    }
  }, [code, router])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !lobbyReady) return
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .fromTo('[data-lobby-hero]', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.58, clearProps: 'transform,opacity,visibility' })
          .fromTo('[data-lobby-section]', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08, clearProps: 'transform,opacity,visibility' }, '-=0.3')
      })
    }, root)
    return () => {
      media.revert()
      context.revert()
    }
  }, [lobbyReady])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !playerKey) return
    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-roster-row]',
          { autoAlpha: 0, x: -10 },
          { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.035, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
        )
      })
    }, root)
    return () => {
      media.revert()
      context.revert()
    }
  }, [playerKey])

  async function updateLobbyConfig(config: RoleConfig, settings: LobbyState['settings']) {
    if (!lobby || !isAdmin) return
    const updated: LobbyState = { ...lobby, config, settings }
    saveLobby(updated)
    setLobby(updated)
    if (channelRef.current) void broadcastLobby(channelRef.current, updated)
  }

  async function handleStart() {
    if (!lobby || !me?.isAdmin || lobby.players.length < 5) return
    if (!isValidRoleSetup(lobby.config, lobby.players.length)) {
      setNoticeKey('lobby.validation.roles')
      return
    }

    const initialState = {
      code,
      status: 'waiting' as const,
      phase: null,
      round: 0,
      config: lobby.config,
      settings: lobby.settings,
      players: lobby.players.map(player => ({
        id: player.id,
        name: player.name,
        role: null,
        isAlive: true,
        isAdmin: player.isAdmin,
        isMayor: false,
        canVote: true,
        loverId: null,
        priestBlessed: false,
      })),
      witchHealUsed: false,
      witchPoisonUsed: false,
      priestUsed: false,
      currentRound: makeEmptyRound(code, 0),
      winner: null,
    }
    const started = startGame(initialState)
    if (started === initialState) {
      setNoticeKey('lobby.validation.roles')
      return
    }
    saveGameState(started)
    const channel = channelRef.current
    if (!channel || !(await broadcastGame(channel, started))) {
      setNoticeKey('lobby.notices.syncFailed')
      return
    }
    window.location.assign(`/game/${code}`)
  }

  async function copyCode() {
    try {
      await copyToClipboard(code)
      setCopied(true)
      setNoticeKey('lobby.notices.codeCopied')
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setNoticeKey('lobby.notices.copyFailed')
    }
  }

  async function shareInvite() {
    const url = `${window.location.origin}/?join=${code}`
    const canUseNativeShare = 'share' in navigator && window.isSecureContext
    try {
      if (canUseNativeShare) {
        await navigator.share({
          title: t('common.appName'),
          text: t('lobby.inviteText', { code }),
          url,
        })
      } else {
        await copyToClipboard(url)
      }
      setShared(true)
      setNoticeKey(canUseNativeShare ? 'lobby.notices.invitationShared' : 'lobby.notices.inviteLinkCopied')
      if (sharedTimerRef.current) clearTimeout(sharedTimerRef.current)
      sharedTimerRef.current = setTimeout(() => setShared(false), 2000)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNoticeKey('lobby.notices.shareFailed')
    }
  }

  function kickPlayer(playerId: string) {
    if (!lobby || !isAdmin) return
    const players = lobby.players.filter(player => player.id !== playerId)
    const updated: LobbyState = {
      ...lobby,
      players,
      config: fitConfigToPlayerCount(lobby.config, players.length, lobby.settings.autoConfig),
    }
    saveLobby(updated)
    setLobby(updated)
    if (channelRef.current) void broadcastLobby(channelRef.current, updated)
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'msg',
      payload: { type: 'kicked', payload: { playerId } },
    })
  }

  function closeLobby() {
    if (!isAdmin || !window.confirm(t('lobby.confirmClose'))) return
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'msg',
      payload: { type: 'lobby_closed' },
    })
    router.replace('/')
  }

  const adminPanelKey = useMemo(() => {
    if (!lobby) return 'loading'
    return `${lobby.players.length}:${JSON.stringify(lobby.config)}:${JSON.stringify(lobby.settings)}`
  }, [lobby])

  if (!lobby || !me) {
    return (
      <main className="app-shell ww-safe-screen relative flex min-h-dvh items-center justify-center px-4">
        <div className="absolute end-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--ww-text-muted)]" role="status">
          <LoaderCircle className="animate-spin" aria-hidden="true" size={18} />
          {t('lobby.loading')}
        </div>
      </main>
    )
  }

  return (
    <main ref={rootRef} className="app-shell ww-page-frame min-h-dvh px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-4 flex items-center justify-end gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <section data-lobby-hero className="ww-lobby-hero overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--ww-success)]">
            <Radio className="ww-live-dot" aria-hidden="true" size={14} />
            {t('lobby.open')}
          </div>
          <p className="mt-5 text-center text-xs uppercase tracking-[0.2em] text-[var(--ww-text-subtle)]">{t('lobby.codeLabel')}</p>
          <button
            type="button"
            onClick={copyCode}
            className="ww-lobby-code-button group mx-auto mt-2 flex min-h-16 items-center gap-3 rounded-xl px-4"
            aria-label={t('lobby.copyCodeLabel', { code })}
          >
            <span className="ww-lobby-code font-display text-4xl tracking-[0.2em] text-[var(--ww-text)] sm:text-5xl" dir="ltr">{code}</span>
            {copied
              ? <Check className="text-[var(--ww-success)]" aria-hidden="true" size={21} />
              : <Copy className="text-[var(--ww-text-subtle)] transition-colors group-hover:text-[var(--ww-text)]" aria-hidden="true" size={20} />}
          </button>
          <button type="button" onClick={shareInvite} className="ww-button ww-button-secondary mx-auto mt-4">
            {shared ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
            {shared ? t('lobby.linkCopied') : t('lobby.shareInvite')}
          </button>
        </section>

        <p className="sr-only" aria-live="polite" role="status">{noticeKey ? t(noticeKey) : ''}</p>

        <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
          <section data-lobby-section className="ww-panel" aria-labelledby="players-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersRound aria-hidden="true" size={17} />
                <h1 id="players-heading" className="ww-section-label">{t('lobby.playersTitle')}</h1>
              </div>
              <span className="ww-status-chip">{lobby.players.length}</span>
            </div>

            <ul className="space-y-2">
              {lobby.players.map(player => (
                <li key={player.id} data-roster-row data-player-id={player.id} className="ww-player-row flex min-h-14 items-center gap-3">
                  <span className="ww-player-avatar" aria-hidden="true">{player.name[0]?.toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--ww-text)]">{player.name}</span>
                  {player.id === me.id && <span className="ww-status-chip">{t('lobby.you')}</span>}
                  {player.isAdmin && <Crown className="text-[var(--ww-gold)]" aria-label={t('lobby.hostLabel')} size={17} />}
                  {isAdmin && !player.isAdmin && player.id !== me.id && (
                    <button
                      type="button"
                      onClick={() => kickPlayer(player.id)}
                      className="ww-icon-button is-danger"
                      aria-label={t('lobby.kickPlayerLabel', { name: player.name })}
                    >
                      <UserRoundX aria-hidden="true" size={17} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {isAdmin ? (
            <section data-lobby-section>
              <AdminPanel
                key={adminPanelKey}
                config={lobby.config}
                playerCount={lobby.players.length}
                votesVisible={lobby.settings.votesVisible}
                mayorEnabled={lobby.settings.mayorEnabled}
                autoConfig={lobby.settings.autoConfig}
                onUpdate={updateLobbyConfig}
                onStart={handleStart}
                canStart={lobby.players.length >= 5}
              />
              <button type="button" onClick={closeLobby} className="ww-button ww-button-ghost mt-3 w-full text-[var(--ww-danger)]">
                <LogOut aria-hidden="true" />
                {t('lobby.close')}
              </button>
            </section>
          ) : (
            <section data-lobby-section className="ww-panel flex min-h-48 flex-col items-center justify-center text-center" role="status">
              <span className="ww-orbit-icon">
                <LoaderCircle className="animate-spin" aria-hidden="true" size={23} />
              </span>
              <p className="mt-4 font-display text-xl text-[var(--ww-text)]">{t('lobby.preparingTitle')}</p>
              <p className="mt-1 text-sm text-[var(--ww-text-subtle)]">{t('lobby.preparingDescription')}</p>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
