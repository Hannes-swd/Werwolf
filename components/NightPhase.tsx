'use client'
import { useState } from 'react'
import { Player, NightAction } from '@/types/game'
import PlayerList from './PlayerList'

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
  nightActions: NightAction[]
  onAction: (action: string, targetId?: string) => Promise<unknown>
}

export default function NightPhase({
  phase, myRole, myId, players, wolfTarget,
  witchHealUsed, witchPoisonUsed, priestUsed,
  girlPeeked, nightActions, onAction,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [peekResult, setPeekResult] = useState<{ wolves: string[]; caught: boolean } | null>(null)
  const [amorFirst, setAmorFirst] = useState<string | null>(null)
  const [witchMode, setWitchMode] = useState<'menu' | 'poison'>('menu')

  const alive = players.filter(p => p.isAlive)
  const aliveOthers = alive.filter(p => p.id !== myId)

  const myAction = nightActions.find(a => a.actorId === myId)
  const done = !!myAction

  async function submit(action: string, targetId?: string) {
    if (loading) return
    setLoading(true)
    await onAction(action, targetId ?? selected ?? undefined)
    setLoading(false)
  }

  // ---- WAITING (Dorfbewohner, Jäger, Amor after round 1, etc.) ----
  if (!['werewolf', 'witch', 'seer', 'priest', 'girl', 'amor'].includes(myRole) ||
      (phase !== myRole && !(phase === 'wolf' && myRole === 'werewolf') && !(phase === 'witch' && myRole === 'witch'))) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-5xl">😴</div>
        <p className="text-gray-400">Du schläfst...</p>
        <p className="text-gray-600 text-sm">Warte auf die anderen Rollen</p>
      </div>
    )
  }

  // ---- AMOR ----
  if (phase === 'amor' && myRole === 'amor') {
    if (done) return <WaitingDone />
    return (
      <div className="space-y-4">
        <p className="text-pink-300 text-center text-sm">Wähle zwei Spieler als Liebespaar</p>
        <PlayerList
          players={aliveOthers}
          myId={myId}
          selectable
          selectedId={amorFirst}
          onSelect={id => {
            if (!amorFirst) { setAmorFirst(id); return }
            submit('link', id)
          }}
        />
      </div>
    )
  }

  // ---- PRIEST ----
  if (phase === 'priest' && myRole === 'priest') {
    if (priestUsed) return <SkippedPhase reason="Segen bereits verwendet" />
    if (done) return <WaitingDone />
    return (
      <div className="space-y-4">
        <p className="text-indigo-300 text-center text-sm">Wen möchtest du segnen? (Immun gegen Wölfe diese Nacht)</p>
        <PlayerList players={alive} myId={myId} selectable selectedId={selected} onSelect={setSelected} />
        <button
          disabled={!selected || loading}
          onClick={() => submit('bless')}
          className="w-full py-3 bg-indigo-600 disabled:opacity-40 rounded-xl text-white font-semibold active:scale-95 transition-all"
        >
          Segnen
        </button>
      </div>
    )
  }

  // ---- WOLF ----
  if (phase === 'wolf' && myRole === 'werewolf') {
    const wolves = players.filter(p => p.role === 'werewolf' && p.isAlive)
    const wolfVotes = nightActions.filter(a => a.phase === 'wolf' && a.action === 'kill')
    const votedWolves = new Set(wolfVotes.map(a => a.actorId))
    const currentTarget = wolfVotes[0]?.targetId ?? null

    if (done) return <WaitingDone />
    return (
      <div className="space-y-4">
        <p className="text-red-300 text-center text-sm">Wähle ein Opfer</p>
        {wolves.length > 1 && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-3">
            {wolves.filter(w => w.id !== myId).map(w => (
              <p key={w.id} className="text-red-300 text-sm flex items-center gap-2">
                <span>{votedWolves.has(w.id) ? '✓' : '⏳'}</span>
                <span>{w.displayName}</span>
                {votedWolves.has(w.id) && currentTarget && (
                  <span className="text-red-400">→ {players.find(p => p.id === currentTarget)?.displayName}</span>
                )}
              </p>
            ))}
          </div>
        )}
        <PlayerList
          players={aliveOthers.filter(p => p.role !== 'werewolf')}
          myId={myId}
          selectable
          selectedId={selected}
          onSelect={setSelected}
        />
        <button
          disabled={!selected || loading}
          onClick={() => submit('kill')}
          className="w-full py-3 bg-red-700 disabled:opacity-40 rounded-xl text-white font-semibold active:scale-95 transition-all"
        >
          Bestätigen
        </button>
      </div>
    )
  }

  // ---- GIRL ----
  if (phase === 'wolf' && myRole === 'girl') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-400 text-sm">Die Wölfe erwachen... alle schlafen.</p>
        {!girlPeeked && !peekResult && (
          <>
            <div className="bg-yellow-950/40 border border-yellow-800 rounded-xl p-3 text-sm text-yellow-300">
              40% Chance entdeckt zu werden!
            </div>
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                const res = await onAction('peek') as { wolves: string[]; caught: boolean }
                setPeekResult(res)
                setLoading(false)
              }}
              className="w-full py-3 bg-teal-700 rounded-xl text-white font-semibold active:scale-95 transition-all"
            >
              👁 Kurz hinschauen
            </button>
          </>
        )}
        {peekResult && (
          <div className="bg-teal-950/50 border border-teal-700 rounded-xl p-4 space-y-2">
            <p className="text-teal-300 font-semibold">Die Wölfe sind:</p>
            {peekResult.wolves.map(name => (
              <p key={name} className="text-white font-bold">{name}</p>
            ))}
            <p className="text-gray-400 text-xs mt-2">Nur du weißt das. Sei vorsichtig!</p>
          </div>
        )}
        {girlPeeked && !peekResult && (
          <p className="text-gray-500 text-sm">Du hast bereits gespäht</p>
        )}
      </div>
    )
  }

  // ---- WITCH ----
  if (phase === 'witch' && myRole === 'witch') {
    const wolfKillId = nightActions.find(a => a.action === 'kill')?.targetId
    const wolfKillTarget = wolfKillId ? players.find(p => p.id === wolfKillId) : null

    if (done) return <WaitingDone />
    if (witchHealUsed && witchPoisonUsed) return <SkippedPhase reason="Beide Tränke verbraucht" />

    if (witchMode === 'poison') {
      return (
        <div className="space-y-4">
          <p className="text-purple-300 text-center text-sm">Wen möchtest du vergiften?</p>
          <PlayerList players={alive} myId={myId} selectable selectedId={selected} onSelect={setSelected} />
          <div className="flex gap-2">
            <button onClick={() => setWitchMode('menu')} className="flex-1 py-3 bg-gray-700 rounded-xl text-white">Zurück</button>
            <button
              disabled={!selected || loading}
              onClick={() => submit('poison')}
              className="flex-1 py-3 bg-purple-700 disabled:opacity-40 rounded-xl text-white font-semibold"
            >
              Vergiften
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {wolfKillTarget ? (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs">Wolf-Opfer</p>
            <p className="text-white font-semibold">{wolfKillTarget.displayName}</p>
          </div>
        ) : (
          <div className="bg-green-950/40 border border-green-800 rounded-xl p-3 text-center">
            <p className="text-green-300 text-sm">Niemand wurde angegriffen (Priester-Schutz)</p>
          </div>
        )}

        <div className="space-y-2">
          {!witchHealUsed && wolfKillTarget && (
            <button
              disabled={loading}
              onClick={() => submit('heal', wolfKillTarget.id)}
              className="w-full py-3 bg-green-700 rounded-xl text-white font-semibold active:scale-95"
            >
              💚 Heilen ({wolfKillTarget.displayName})
            </button>
          )}
          {!witchPoisonUsed && (
            <button
              disabled={loading}
              onClick={() => setWitchMode('poison')}
              className="w-full py-3 bg-purple-700 rounded-xl text-white font-semibold active:scale-95"
            >
              ☠️ Vergiften
            </button>
          )}
          <button
            disabled={loading}
            onClick={() => submit('skip')}
            className="w-full py-3 bg-gray-700 rounded-xl text-gray-300 active:scale-95"
          >
            Nichts tun
          </button>
        </div>
      </div>
    )
  }

  // ---- SEER ----
  if (phase === 'seer' && myRole === 'seer') {
    const seerAction = nightActions.find(a => a.actorId === myId && a.phase === 'seer')
    if (seerAction) {
      const target = players.find(p => p.id === seerAction.targetId)
      return (
        <div className="space-y-3 text-center">
          <p className="text-blue-300 text-sm">Du hast geschaut:</p>
          <div className="bg-blue-950/50 border border-blue-700 rounded-xl p-4">
            <p className="text-white font-semibold">{target?.displayName}</p>
            <p className="text-blue-300 text-lg font-bold mt-1">
              {target?.role === 'werewolf' ? '🐺 WERWOLF' : '✅ Kein Werwolf'}
            </p>
          </div>
          <p className="text-gray-500 text-xs">Nur du siehst das. Warte auf die anderen.</p>
        </div>
      )
    }
    if (done) return <WaitingDone />
    return (
      <div className="space-y-4">
        <p className="text-blue-300 text-center text-sm">Wessen Rolle möchtest du sehen?</p>
        <PlayerList players={aliveOthers} myId={myId} selectable selectedId={selected} onSelect={setSelected} />
        <button
          disabled={!selected || loading}
          onClick={() => submit('reveal')}
          className="w-full py-3 bg-blue-700 disabled:opacity-40 rounded-xl text-white font-semibold active:scale-95"
        >
          Schauen
        </button>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-500">😴 Warte...</p>
    </div>
  )
}

function WaitingDone() {
  return (
    <div className="text-center py-8 space-y-3">
      <div className="text-4xl">✓</div>
      <p className="text-gray-400">Aktion abgeschickt</p>
      <p className="text-gray-600 text-sm">Warte auf die anderen...</p>
    </div>
  )
}

function SkippedPhase({ reason }: { reason: string }) {
  return (
    <div className="text-center py-8 space-y-3">
      <p className="text-gray-500 text-sm">{reason}</p>
    </div>
  )
}
