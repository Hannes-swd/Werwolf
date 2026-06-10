'use client'
import { useState } from 'react'
import { RoleConfig, ROLE_LABELS, ROLE_ICONS, Role } from '@/types/game'
import { getAutoConfig, getTotalRoles } from '@/lib/autoConfig'

const CONFIGURABLE_ROLES: Role[] = ['werewolf', 'witch', 'seer', 'hunter', 'amor', 'fool', 'girl', 'priest']

interface Props {
  config: RoleConfig
  playerCount: number
  votesVisible: boolean
  mayorEnabled: boolean
  autoConfig: boolean
  onUpdate: (config: RoleConfig, settings: { votesVisible: boolean; mayorEnabled: boolean; autoConfig: boolean }) => Promise<void>
  onStart: () => Promise<void>
  canStart: boolean
}

export default function AdminPanel({
  config: initialConfig,
  playerCount,
  votesVisible: initVotesVisible,
  mayorEnabled: initMayor,
  autoConfig: initAuto,
  onUpdate,
  onStart,
  canStart,
}: Props) {
  const [config, setConfig] = useState<RoleConfig>(initialConfig)
  const [votesVisible, setVotesVisible] = useState(initVotesVisible)
  const [mayorEnabled, setMayorEnabled] = useState(initMayor)
  const [autoConfig, setAutoConfig] = useState(initAuto)
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)

  const total = getTotalRoles(config)
  const diff = total - playerCount
  const ready = diff === 0 && canStart

  function adjust(role: Role, delta: number) {
    if (autoConfig) return
    const next = Math.max(0, (config[role] ?? 0) + delta)
    const updated = { ...config, [role]: next }
    setConfig(updated)
    save(updated)
  }

  async function save(cfg = config) {
    setLoading(true)
    await onUpdate(cfg, { votesVisible, mayorEnabled, autoConfig })
    setLoading(false)
  }

  function toggleAuto() {
    const next = !autoConfig
    setAutoConfig(next)
    if (next) {
      const auto = getAutoConfig(playerCount)
      setConfig(auto)
      onUpdate(auto, { votesVisible, mayorEnabled, autoConfig: true })
    }
  }

  async function handleStart() {
    setStarting(true)
    await onStart()
    setStarting(false)
  }

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="bg-white/5 rounded-2xl p-4 space-y-3">
        <h3 className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Einstellungen</h3>

        <label className="flex items-center justify-between py-2">
          <span className="text-white text-sm">Votes sichtbar</span>
          <button
            onClick={() => { setVotesVisible(!votesVisible); save() }}
            className={`w-12 h-6 rounded-full transition-colors ${votesVisible ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${votesVisible ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </label>

        <label className="flex items-center justify-between py-2 border-t border-white/10">
          <span className="text-white text-sm">Bürgermeister</span>
          <button
            onClick={() => { setMayorEnabled(!mayorEnabled); save() }}
            className={`w-12 h-6 rounded-full transition-colors ${mayorEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${mayorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </label>

        <label className="flex items-center justify-between py-2 border-t border-white/10">
          <span className="text-white text-sm">Auto-Rollen</span>
          <button
            onClick={toggleAuto}
            className={`w-12 h-6 rounded-full transition-colors ${autoConfig ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${autoConfig ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </label>
      </div>

      {/* Role config */}
      <div className="bg-white/5 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Rollen</h3>
          <span className={`text-sm font-semibold ${diff === 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
            {total}/{playerCount}
            {diff !== 0 && ` (${diff > 0 ? '+' : ''}${diff})`}
          </span>
        </div>

        {CONFIGURABLE_ROLES.map(role => (
          <div key={role} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{ROLE_ICONS[role]}</span>
              <span className="text-white text-sm">{ROLE_LABELS[role]}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={autoConfig || (config[role] ?? 0) === 0}
                onClick={() => adjust(role, -1)}
                className="w-7 h-7 rounded-lg bg-white/10 text-white disabled:opacity-30 flex items-center justify-center text-lg leading-none"
              >−</button>
              <span className="text-white w-4 text-center">{config[role] ?? 0}</span>
              <button
                disabled={autoConfig}
                onClick={() => adjust(role, 1)}
                className="w-7 h-7 rounded-lg bg-white/10 text-white disabled:opacity-30 flex items-center justify-center text-lg leading-none"
              >+</button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between py-1.5 border-t border-white/10 mt-2 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-gray-400 text-sm">Dorfbewohner</span>
          </div>
          <span className="text-gray-400 text-sm">
            {Math.max(0, playerCount - (total - (config.villager ?? 0)))}
          </span>
        </div>
      </div>

      <button
        disabled={!ready || starting}
        onClick={handleStart}
        className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95
          ${ready ? 'bg-green-600 shadow-lg shadow-green-900/50' : 'bg-gray-700 opacity-50'}`}
      >
        {starting ? 'Starte...' : ready ? '▶ Spiel starten' : `Noch ${Math.abs(diff)} Rolle${Math.abs(diff) !== 1 ? 'n' : ''} ${diff > 0 ? 'zu viel' : 'fehlen'}`}
      </button>

      {!canStart && (
        <p className="text-center text-gray-500 text-xs">Mindestens 5 Spieler benötigt</p>
      )}
    </div>
  )
}
