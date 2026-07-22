'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CircleAlert,
  LoaderCircle,
  MoonStar,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { gsap } from 'gsap'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { WolfMark } from '@/components/icons'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { useT, type TranslationKey } from '@/lib/i18n'
import { generateGuestName, generateLobbyCode } from '@/lib/roleAssignment'
import { saveName, loadName, saveLobby, saveMyPlayer } from '@/lib/storage'
import { getAutoConfig } from '@/lib/autoConfig'
import { sendLobbyMessage, subscribeToLobby, type BroadcastMsg } from '@/lib/broadcast'
import { supabase } from '@/lib/supabase'
import { isLobbyCode, normalizeLobbyCode, normalizePlayerName } from '@/lib/validation'

interface JoinAttempt {
  channel: RealtimeChannel | null
  lookupTimer: ReturnType<typeof setTimeout> | null
  requestTimer: ReturnType<typeof setTimeout> | null
  resolved: boolean
}

export default function HomePageClient() {
  const router = useRouter()
  const t = useT()
  const rootRef = useRef<HTMLElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const joinAttemptRef = useRef<JoinAttempt | null>(null)
  const initialTranslatorRef = useRef(t)
  const generatedNameRef = useRef(false)
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState<'create' | 'join' | null>(null)
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null)

  const clearJoinAttempt = useCallback(async (attempt = joinAttemptRef.current) => {
    if (!attempt) return

    attempt.resolved = true
    if (attempt.lookupTimer) clearTimeout(attempt.lookupTimer)
    if (attempt.requestTimer) clearTimeout(attempt.requestTimer)
    attempt.lookupTimer = null
    attempt.requestTimer = null

    const channel = attempt.channel
    attempt.channel = null
    if (joinAttemptRef.current === attempt) joinAttemptRef.current = null
    if (channel) await supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    const initializationTimer = setTimeout(() => {
      const cached = loadName()
      generatedNameRef.current = !cached
      setName(cached || generateGuestName(initialTranslatorRef.current('home.guestName')))

      const params = new URLSearchParams(window.location.search)
      const invite = params.get('join')
      if (invite) setJoinCode(normalizeLobbyCode(invite))

      if (params.get('kicked')) setErrorKey('home.errors.kicked')
      else if (params.get('closed')) setErrorKey('home.errors.closed')

      if (params.toString()) window.history.replaceState({}, '', '/')
    }, 0)

    return () => {
      clearTimeout(initializationTimer)
      void clearJoinAttempt()
    }
  }, [clearJoinAttempt])

  useEffect(() => {
    if (generatedNameRef.current) setName(generateGuestName(t('home.guestName')))
  }, [t])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const atmosphere = root.querySelector('[data-home-atmosphere]')
        const reveals = gsap.utils.toArray<HTMLElement>('[data-home-reveal]', root)
        const title = root.querySelector('.ww-home-title')
        const moon = root.querySelector('.ww-home-moon')

        const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
        if (atmosphere) {
          timeline.fromTo(
            atmosphere,
            { autoAlpha: 0, scale: 1.035 },
            { autoAlpha: 1, scale: 1, duration: 1.15, ease: 'power2.out' },
            0,
          )
        }
        timeline.fromTo(
          reveals,
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.09, clearProps: 'transform' },
          0.12,
        )
        if (title) {
          // Wipe the wordmark up from its own baseline. Clipping the whole line
          // keeps Arabic letter-joining and CJK intact, unlike a per-glyph split.
          timeline.fromTo(
            title,
            { clipPath: 'inset(105% 0% -10% 0%)', y: 14 },
            {
              clipPath: 'inset(-10% 0% -10% 0%)',
              y: 0,
              duration: 0.9,
              ease: 'power4.out',
              clearProps: 'clipPath,transform',
            },
            0.22,
          )
        }
        if (moon) {
          timeline.fromTo(
            moon,
            { autoAlpha: 0, y: -18, scale: 0.92 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 1.4, ease: 'power2.out' },
            0.1,
          )
          // Long, barely-there drift so the sky never looks frozen.
          gsap.to(moon, {
            y: '+=10',
            duration: 9,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 1.4,
          })
        }
      }, root)

      return () => context.revert()
    })

    return () => media.revert()
  }, [])

  function handleNameChange(nextName: string) {
    generatedNameRef.current = false
    setName(nextName)
    saveName(nextName)
  }

  function createLobby() {
    const playerName = normalizePlayerName(name)
    if (!playerName) return
    setLoading('create')
    setErrorKey(null)
    const code = generateLobbyCode()
    const playerId = crypto.randomUUID()

    const config = getAutoConfig(1)
    const settings = { votesVisible: true, mayorEnabled: true, autoConfig: false }

    saveLobby({ code, config, settings, players: [{ id: playerId, name: playerName, isAdmin: true }] })
    saveMyPlayer(code, { id: playerId, name: playerName, isAdmin: true })
    saveName(playerName)

    router.push(`/lobby/${code}`)
  }

  async function joinLobby() {
    const code = normalizeLobbyCode(joinCode)
    const playerName = normalizePlayerName(name)
    if (!isLobbyCode(code) || !playerName) {
      setErrorKey('home.errors.invalidCode')
      return
    }

    await clearJoinAttempt()
    setLoading('join')
    setErrorKey(null)

    const playerId = crypto.randomUUID()
    const attempt: JoinAttempt = {
      channel: null,
      lookupTimer: null,
      requestTimer: null,
      resolved: false,
    }
    joinAttemptRef.current = attempt

    attempt.channel = subscribeToLobby(code, async (msg: BroadcastMsg) => {
      if (attempt.resolved || joinAttemptRef.current !== attempt) return
      if (msg.type !== 'lobby_state') return

      const lobby = msg.payload
      const alreadyAdded = lobby.players.some(player => player.id === playerId)
      const updatedPlayers = alreadyAdded
        ? lobby.players
        : [...lobby.players, { id: playerId, name: playerName, isAdmin: false }]

      await clearJoinAttempt(attempt)
      saveLobby({ ...lobby, players: updatedPlayers })
      saveMyPlayer(code, { id: playerId, name: playerName, isAdmin: false })
      saveName(playerName)
      window.location.assign(`/lobby/${code}`)
    })

    attempt.lookupTimer = setTimeout(async () => {
      if (attempt.resolved || joinAttemptRef.current !== attempt) return
      await clearJoinAttempt(attempt)
      setErrorKey('home.errors.notFound')
      setLoading(null)
    }, 8000)

    attempt.requestTimer = setTimeout(() => {
      if (attempt.resolved || joinAttemptRef.current !== attempt) return
      if (attempt.channel) {
        void sendLobbyMessage(attempt.channel, {
          type: 'request_sync',
          payload: { joiningPlayer: { id: playerId, name: playerName } },
        })
      }
    }, 500)
  }

  const hasValidName = Boolean(normalizePlayerName(name))
  const normalizedJoinCode = normalizeLobbyCode(joinCode)
  const hasValidCode = isLobbyCode(normalizedJoinCode)
  const showCodeError = normalizedJoinCode.length === 6 && !hasValidCode
  const homeTitle = t('home.title')

  return (
    <main ref={rootRef} className="ww-app-shell ww-home-shell">
      <div className="ww-home-atmosphere" data-home-atmosphere aria-hidden="true">
        <div className="ww-home-moon" />
        <div className="ww-home-ridge ww-home-ridge-back" />
        <div className="ww-home-ridge ww-home-ridge-front" />
      </div>

      <div
        className="ww-home-language absolute end-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-20 flex items-center gap-2"
        data-home-reveal
      >
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="ww-home-layout">
        <header className="ww-home-brand" data-home-reveal>
          <div className="ww-brand-seal" aria-hidden="true">
            <WolfMark size={58} strokeWidth={1.55} />
          </div>
          <p className="ww-home-kicker flex items-center gap-2">
            <MoonStar aria-hidden="true" size={14} />
            {t('home.kicker')}
          </p>
          <h1
            className="ww-home-title"
            data-long-title={homeTitle.length > 9 ? '' : undefined}
          >
            {homeTitle}
          </h1>
          <p className="ww-home-subtitle">{t('home.subtitle')}</p>
        </header>

        <section className="ww-surface-strong ww-home-panel" data-home-reveal aria-label={t('home.panelLabel')}>
          <div className="ww-field">
            <label className="ww-field-label" htmlFor="player-name">
              <UserRound aria-hidden="true" />
              {t('home.nameLabel')}
            </label>
            <input
              id="player-name"
              name="playerName"
              value={name}
              onChange={event => handleNameChange(event.target.value)}
              onKeyDown={event => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                codeInputRef.current?.focus()
              }}
              placeholder={t('home.namePlaceholder')}
              maxLength={20}
              autoComplete="nickname"
              enterKeyHint="next"
              disabled={loading !== null}
              aria-describedby="player-name-hint"
              className="ww-input"
            />
            <p id="player-name-hint" className="ww-field-hint">{t('home.nameHint')}</p>
          </div>

          {errorKey && (
            <div className="ww-alert" role="alert" aria-live="assertive">
              <CircleAlert aria-hidden="true" />
              <span>{t(errorKey)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={createLobby}
            disabled={!hasValidName || loading !== null}
            aria-busy={loading === 'create'}
            className="ww-button ww-button-primary ww-home-create"
          >
            {loading === 'create' ? (
              <>
                <LoaderCircle className="ww-spinner" aria-hidden="true" />
                {t('home.creating')}
              </>
            ) : (
              <>
                <UsersRound aria-hidden="true" />
                {t('home.create')}
              </>
            )}
          </button>

          <div className="ww-divider">{t('home.divider')}</div>

          <form
            className="ww-field"
            onSubmit={event => {
              event.preventDefault()
              void joinLobby()
            }}
          >
            <label className="ww-field-label" htmlFor="lobby-code">{t('home.codeLabel')}</label>
            <div className="ww-home-join">
              <input
                ref={codeInputRef}
                id="lobby-code"
                name="lobbyCode"
                value={joinCode}
                onChange={event => setJoinCode(normalizeLobbyCode(event.target.value))}
                placeholder="ABC123"
                maxLength={6}
                minLength={6}
                pattern="[A-HJ-NP-Z2-9]{6}"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint="go"
                spellCheck={false}
                disabled={loading !== null}
                aria-label={t('home.codeInputLabel')}
                aria-describedby={showCodeError ? 'lobby-code-error' : undefined}
                aria-invalid={showCodeError}
                dir="ltr"
                className="ww-input ww-code-input"
              />
              <button
                type="submit"
                disabled={!hasValidCode || !hasValidName || loading !== null}
                aria-busy={loading === 'join'}
                className="ww-button ww-button-secondary"
              >
                {loading === 'join' ? (
                  <>
                    <LoaderCircle className="ww-spinner" aria-hidden="true" />
                    {t('home.searching')}
                  </>
                ) : (
                  <>
                    {t('home.join')}
                    <ArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
            {showCodeError && (
              <p id="lobby-code-error" className="text-xs text-[var(--ww-danger)]" role="status">
                {t('home.errors.invalidCode')}
              </p>
            )}
          </form>
        </section>

        <p className="ww-home-note" data-home-reveal>
          <ShieldCheck aria-hidden="true" />
          {t('home.privacyNote')}
        </p>
      </div>
    </main>
  )
}
