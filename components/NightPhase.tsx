'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Eye,
  FlaskConical,
  HeartPulse,
  Hourglass,
  MoonStar,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { NightAction, Player, Role } from '@/types/game'
import { useT } from '@/lib/i18n'
import PlayerList from './PlayerList'
import { RoleIcon, WolfMark } from './icons'

interface Props {
  phase: string
  myRole: string
  myId: string
  players: Player[]
  wolfTarget: string | null
  witchHealUsed: boolean
  witchPoisonUsed: boolean
  priestUsed: boolean
  girlPeeked: boolean
  girlPeekResult: { wolves: string[] } | null
  nightActions: NightAction[]
  onAction: (action: string, targetId?: string, secondaryTargetId?: string) => Promise<unknown>
}

export default function NightPhase({
  phase,
  myRole,
  myId,
  players,
  wolfTarget,
  witchHealUsed,
  witchPoisonUsed,
  priestUsed,
  girlPeeked,
  girlPeekResult,
  nightActions,
  onAction,
}: Props) {
  const t = useT()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [amorPair, setAmorPair] = useState<[string | null, string | null]>([null, null])
  const [witchMode, setWitchMode] = useState<'menu' | 'poison'>('menu')

  const alive = players.filter(player => player.isAlive)
  const aliveOthers = alive.filter(player => player.id !== myId)
  const myPhaseActions = nightActions.filter(action => action.actorId === myId && action.phase === phase)

  async function submit(action: string, targetId?: string, secondaryTargetId?: string) {
    if (loading) return
    setLoading(true)
    try {
      await onAction(action, targetId ?? selected ?? undefined, secondaryTargetId)
    } finally {
      setLoading(false)
    }
  }

  const isActiveRole = phase === myRole || (phase === 'wolf' && (myRole === 'werewolf' || myRole === 'girl'))
  if (!isActiveRole) return <SleepingState />

  if (phase === 'amor' && myRole === 'amor') {
    if (myPhaseActions.some(action => action.action === 'link')) return <WaitingDone />
    const [first, second] = amorPair
    return (
      <PhaseSection
        role="amor"
        title={t('components.night.amor.title')}
        description={t('components.night.amor.description')}
      >
        <PlayerList
          players={aliveOthers}
          myId={myId}
          selectable
          selectedIds={amorPair.filter((id): id is string => Boolean(id))}
          onSelect={id => {
            if (id === first) {
              setAmorPair([second, null])
            } else if (id === second) {
              setAmorPair([first, null])
            } else if (!first) {
              setAmorPair([id, null])
            } else {
              setAmorPair([first, id])
            }
          }}
        />
        <button
          type="button"
          disabled={!first || !second || loading}
          onClick={() => first && second && submit('link', first, second)}
          className="ww-button ww-button-primary w-full"
        >
          <Sparkles aria-hidden="true" />
          {t('components.night.amor.confirm')}
        </button>
      </PhaseSection>
    )
  }

  if (phase === 'priest' && myRole === 'priest') {
    if (priestUsed) return <SkippedPhase reason={t('components.night.priest.used')} />
    if (myPhaseActions.some(action => action.action === 'bless')) return <WaitingDone />
    return (
      <PhaseSection
        role="priest"
        title={t('components.night.priest.title')}
        description={t('components.night.priest.description')}
      >
        <PlayerList players={alive} myId={myId} selectable selectedId={selected} onSelect={setSelected} />
        <button
          type="button"
          disabled={!selected || loading}
          onClick={() => submit('bless')}
          className="ww-button ww-button-primary w-full"
        >
          <ShieldCheck aria-hidden="true" />
          {t('components.night.priest.confirm')}
        </button>
      </PhaseSection>
    )
  }

  if (phase === 'wolf' && myRole === 'werewolf') {
    const wolves = players.filter(player => player.role === 'werewolf' && player.isAlive)
    const wolfVotes = nightActions.filter(action => action.phase === 'wolf' && action.action === 'kill')
    const ownVote = wolfVotes.find(action => action.actorId === myId)
    const wolfSelection = selected ?? ownVote?.targetId ?? wolfTarget

    return (
      <PhaseSection
        role="werewolf"
        title={t('components.night.wolf.title')}
        description={t('components.night.wolf.description')}
      >
        {wolves.length > 1 && (
          <div className="ww-surface-strong space-y-2 p-3" aria-label={t('components.night.wolf.voteLabel')}>
            {wolves.filter(wolf => wolf.id !== myId).map(wolf => {
              const vote = wolfVotes.find(action => action.actorId === wolf.id)
              const target = vote ? players.find(player => player.id === vote.targetId) : null
              return (
                <div key={wolf.id} className="flex min-w-0 items-center gap-2 text-sm text-[var(--ww-text-muted)]">
                  {vote
                    ? <CircleCheck className="shrink-0 text-[var(--ww-success)]" aria-label={t('components.night.wolf.voted')} size={16} />
                    : <Hourglass className="shrink-0 text-[var(--ww-text-subtle)]" aria-label={t('components.night.wolf.waiting')} size={16} />}
                  <span className="min-w-0 flex-1 truncate">{wolf.displayName}</span>
                  {target && (
                    <span className="max-w-[45%] shrink-0 truncate text-xs text-[var(--ww-danger)]">{t('components.night.wolf.target', { name: target.displayName })}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <PlayerList
          players={aliveOthers.filter(player => player.role !== 'werewolf')}
          myId={myId}
          selectable
          selectedId={wolfSelection}
          onSelect={setSelected}
        />
        <button
          type="button"
          disabled={!wolfSelection || loading}
          onClick={() => wolfSelection && submit('kill', wolfSelection)}
          className="ww-button ww-button-danger w-full"
        >
          <WolfMark aria-hidden="true" size={20} />
          {t('components.night.wolf.confirm')}
        </button>
      </PhaseSection>
    )
  }

  if (phase === 'wolf' && myRole === 'girl') {
    return (
      <PhaseSection
        role="girl"
        title={t('components.night.girl.title')}
        description={t('components.night.girl.description')}
      >
        {!girlPeeked && !girlPeekResult && (
          <>
            <div className="ww-callout is-warning">
              <TriangleAlert aria-hidden="true" size={17} />
              <span>{t('components.night.girl.warning')}</span>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => submit('peek')}
              className="ww-button ww-button-primary w-full"
            >
              <Eye aria-hidden="true" />
              {t('components.night.girl.peek')}
            </button>
          </>
        )}
        {girlPeekResult && (
          <div className="ww-surface-strong space-y-3 p-4 text-center" role="status" aria-live="polite">
            <WolfMark className="mx-auto text-[var(--ww-danger)]" aria-hidden="true" size={30} />
            <p className="ww-section-label">{t('components.night.girl.resultTitle')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {girlPeekResult.wolves.map(name => <span key={name} className="ww-status-chip is-danger">{name}</span>)}
            </div>
            <p className="text-xs leading-relaxed text-[var(--ww-text-subtle)]">{t('components.night.girl.keepSecret')}</p>
          </div>
        )}
        {girlPeeked && !girlPeekResult && <WaitingDone label={t('components.night.girl.alreadyPeeked')} />}
      </PhaseSection>
    )
  }

  if (phase === 'witch' && myRole === 'witch') {
    const wolfKillTarget = wolfTarget ? players.find(player => player.id === wolfTarget) : null
    const healedThisNight = myPhaseActions.some(action => action.action === 'heal')
    const poisonedThisNight = myPhaseActions.some(action => action.action === 'poison')
    const phaseFinished = myPhaseActions.some(action => action.action === 'skip')
    const canHeal = !witchHealUsed && !healedThisNight && Boolean(wolfKillTarget)
    const canPoison = !witchPoisonUsed && !poisonedThisNight

    if (phaseFinished) return <WaitingDone />

    if (witchMode === 'poison' && canPoison) {
      return (
        <PhaseSection role="witch" title={t('components.night.witch.poisonTitle')} description={t('components.night.witch.poisonDescription')}>
          <PlayerList players={alive} myId={myId} selectable selectedId={selected} onSelect={setSelected} />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setSelected(null); setWitchMode('menu') }} className="ww-button ww-button-secondary">
              <ArrowLeft aria-hidden="true" />
              {t('components.night.witch.back')}
            </button>
            <button
              type="button"
              disabled={!selected || loading}
              onClick={async () => {
                await submit('poison')
                setSelected(null)
                setWitchMode('menu')
              }}
              className="ww-button ww-button-danger"
            >
              <FlaskConical aria-hidden="true" />
              {t('components.night.witch.poison')}
            </button>
          </div>
        </PhaseSection>
      )
    }

    return (
      <PhaseSection
        role="witch"
        title={t('components.night.witch.title')}
        description={t('components.night.witch.description')}
      >
        <div className="ww-surface-strong p-3 text-center">
          <p className="ww-section-label">{t('components.night.witch.packTarget')}</p>
          <p className="mt-1 break-words font-semibold text-[var(--ww-text)]">{wolfKillTarget?.displayName ?? t('components.night.witch.noAttack')}</p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            disabled={!canHeal || loading}
            onClick={() => wolfKillTarget && submit('heal', wolfKillTarget.id)}
            className="ww-button ww-button-success w-full"
          >
            <HeartPulse aria-hidden="true" />
            {healedThisNight
              ? t('components.night.witch.healUsed')
              : witchHealUsed
                ? t('components.night.witch.healSpent')
                : wolfKillTarget
                  ? t('components.night.witch.healTarget', { name: wolfKillTarget.displayName })
                  : t('components.night.witch.healSpent')}
          </button>
          <button
            type="button"
            disabled={!canPoison || loading}
            onClick={() => setWitchMode('poison')}
            className="ww-button ww-button-danger w-full"
          >
            <FlaskConical aria-hidden="true" />
            {poisonedThisNight
              ? t('components.night.witch.poisonUsed')
              : witchPoisonUsed
                ? t('components.night.witch.poisonSpent')
                : t('components.night.witch.choosePoison')}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => submit('skip')}
            className="ww-button ww-button-secondary w-full"
          >
            <Check aria-hidden="true" />
            {t('components.night.witch.finish')}
          </button>
        </div>
      </PhaseSection>
    )
  }

  if (phase === 'seer' && myRole === 'seer') {
    const seerAction = myPhaseActions.find(action => action.action === 'reveal')
    if (seerAction) {
      const target = players.find(player => player.id === seerAction.targetId)
      const isWerewolf = target?.role === 'werewolf'
      return (
        <PhaseSection role="seer" title={t('components.night.seer.visionTitle')} description={t('components.night.seer.visionDescription')}>
          <div className={`ww-reveal-result ${isWerewolf ? 'is-danger' : 'is-success'}`} role="status">
            {isWerewolf
              ? <WolfMark aria-hidden="true" size={32} />
              : <ShieldCheck aria-hidden="true" size={32} />}
            <p className="font-semibold text-[var(--ww-text)]">{target?.displayName}</p>
            <p className="ww-section-label">{isWerewolf ? t('components.night.seer.wolf') : t('components.night.seer.safe')}</p>
          </div>
        </PhaseSection>
      )
    }

    return (
      <PhaseSection role="seer" title={t('components.night.seer.title')} description={t('components.night.seer.description')}>
        <PlayerList players={aliveOthers} myId={myId} selectable selectedId={selected} onSelect={setSelected} />
        <button
          type="button"
          disabled={!selected || loading}
          onClick={() => submit('reveal')}
          className="ww-button ww-button-primary w-full"
        >
          <Eye aria-hidden="true" />
          {t('components.night.seer.reveal')}
        </button>
      </PhaseSection>
    )
  }

  return <SleepingState />
}

function PhaseSection({
  role,
  title,
  description,
  children,
}: {
  role: Role
  title: string
  description: string
  children: React.ReactNode
}) {
  const t = useT()
  return (
    <section className="space-y-4" aria-labelledby={`night-${role}-title`}>
      <header className="text-center">
        <span className="ww-role-icon mx-auto mb-3" data-role={role}>
          <RoleIcon role={role} size={22} aria-hidden="true" />
        </span>
        <p className="ww-section-label">{t(`roles.${role}`)}</p>
        <h2 id={`night-${role}-title`} className="mt-1 font-display text-2xl text-[var(--ww-text)]">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--ww-text-muted)]">{description}</p>
      </header>
      {children}
    </section>
  )
}

function SleepingState() {
  const t = useT()
  return (
    <div className="py-8 text-center" role="status">
      <span className="ww-orbit-icon mx-auto">
        <MoonStar aria-hidden="true" size={25} />
      </span>
      <p className="mt-4 font-display text-xl text-[var(--ww-text)]">{t('components.night.sleepingTitle')}</p>
      <p className="mt-1 text-sm text-[var(--ww-text-subtle)]">{t('components.night.sleepingDescription')}</p>
    </div>
  )
}

function WaitingDone({ label }: { label?: string }) {
  const t = useT()
  return (
    <div className="py-8 text-center" role="status">
      <span className="ww-orbit-icon mx-auto is-success">
        <CircleCheck aria-hidden="true" size={25} />
      </span>
      <p className="mt-4 font-medium text-[var(--ww-text)]">{label ?? t('components.night.actionSent')}</p>
      <p className="mt-1 text-sm text-[var(--ww-text-subtle)]">{t('components.night.waitingOthers')}</p>
    </div>
  )
}

function SkippedPhase({ reason }: { reason: string }) {
  return (
    <div className="py-8 text-center" role="status">
      <span className="ww-orbit-icon mx-auto">
        <MoonStar aria-hidden="true" size={24} />
      </span>
      <p className="mt-4 text-sm text-[var(--ww-text-muted)]">{reason}</p>
    </div>
  )
}
