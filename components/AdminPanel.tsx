'use client'

import { useState } from 'react'
import {
  Crown,
  Eye,
  EyeOff,
  LoaderCircle,
  Minus,
  Play,
  Plus,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { RoleConfig, Role } from '@/types/game'
import { getAutoConfig, getTotalRoles } from '@/lib/autoConfig'
import { isValidRoleSetup } from '@/lib/gameEngine'
import { RoleIcon } from '@/components/icons'
import { useT } from '@/lib/i18n'

const CONFIGURABLE_ROLES: Role[] = ['werewolf', 'witch', 'seer', 'hunter', 'amor', 'fool', 'girl', 'priest']

const MAX_ROLE_COUNT: Partial<Record<Role, number>> = {
  witch: 1,
  seer: 1,
  hunter: 1,
  amor: 1,
  fool: 1,
  girl: 1,
  priest: 1,
}

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

type Settings = {
  votesVisible: boolean
  mayorEnabled: boolean
  autoConfig: boolean
}

export default function AdminPanel({
  config: initialConfig,
  playerCount,
  votesVisible: initialVotesVisible,
  mayorEnabled: initialMayorEnabled,
  autoConfig: initialAutoConfig,
  onUpdate,
  onStart,
  canStart,
}: Props) {
  const t = useT()
  const [config, setConfig] = useState<RoleConfig>(initialConfig)
  const [votesVisible, setVotesVisible] = useState(initialVotesVisible)
  const [mayorEnabled, setMayorEnabled] = useState(initialMayorEnabled)
  const [autoConfig, setAutoConfig] = useState(initialAutoConfig)
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)

  const total = getTotalRoles(config)
  const diff = total - playerCount
  const hasWolf = config.werewolf > 0
  const hasSafeBalance = config.werewolf < total - config.werewolf
  const ready = canStart && isValidRoleSetup(config, playerCount)

  function currentSettings(overrides: Partial<Settings> = {}): Settings {
    return { votesVisible, mayorEnabled, autoConfig, ...overrides }
  }

  async function persist(nextConfig: RoleConfig, nextSettings: Settings) {
    setSaving(true)
    try {
      await onUpdate(nextConfig, nextSettings)
    } finally {
      setSaving(false)
    }
  }

  function adjust(role: Role, delta: number) {
    if (autoConfig || saving) return
    const max = role === 'werewolf' ? Math.max(1, Math.floor((playerCount - 1) / 2)) : (MAX_ROLE_COUNT[role] ?? playerCount)
    const nextCount = Math.min(max, Math.max(0, (config[role] ?? 0) + delta))
    const nextSpecials = CONFIGURABLE_ROLES.reduce(
      (sum, currentRole) => sum + (currentRole === role ? nextCount : (config[currentRole] ?? 0)),
      0,
    )
    const updated = {
      ...config,
      [role]: nextCount,
      villager: Math.max(0, playerCount - nextSpecials),
    }
    setConfig(updated)
    void persist(updated, currentSettings())
  }

  function toggleVotes() {
    const next = !votesVisible
    setVotesVisible(next)
    void persist(config, currentSettings({ votesVisible: next }))
  }

  function toggleMayor() {
    const next = !mayorEnabled
    setMayorEnabled(next)
    void persist(config, currentSettings({ mayorEnabled: next }))
  }

  function toggleAuto() {
    const next = !autoConfig
    const nextConfig = next ? getAutoConfig(playerCount) : config
    setAutoConfig(next)
    setConfig(nextConfig)
    void persist(nextConfig, currentSettings({ autoConfig: next }))
  }

  async function handleStart() {
    if (!ready || starting) return
    setStarting(true)
    try {
      await onStart()
    } finally {
      setStarting(false)
    }
  }

  const readinessText = !canStart
    ? t('components.admin.minimumPlayers')
    : !hasWolf
      ? t('components.admin.minimumWolf')
      : !hasSafeBalance
        ? t('components.admin.wolfBalance')
      : diff === 0
        ? t('components.admin.ready')
        : t(diff > 0 ? 'components.admin.excessRoles' : 'components.admin.missingRoles', { count: Math.abs(diff) })

  return (
    <div className="space-y-4">
      <section className="ww-panel space-y-1" aria-labelledby="settings-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" size={17} />
            <h2 id="settings-heading" className="ww-section-label">{t('components.admin.settings')}</h2>
          </div>
          {saving && (
            <span className="ww-status-chip" role="status">
              <LoaderCircle className="animate-spin" aria-hidden="true" size={13} />
              {t('components.admin.saving')}
            </span>
          )}
        </div>

        <SettingSwitch
          label={t('components.admin.votesLabel')}
          description={t('components.admin.votesDescription')}
          checked={votesVisible}
          disabled={saving}
          icon={votesVisible ? Eye : EyeOff}
          onToggle={toggleVotes}
        />
        <SettingSwitch
          label={t('components.admin.mayorLabel')}
          description={t('components.admin.mayorDescription')}
          checked={mayorEnabled}
          disabled={saving}
          icon={Crown}
          onToggle={toggleMayor}
        />
        <SettingSwitch
          label={t('components.admin.autoLabel')}
          description={t('components.admin.autoDescription')}
          checked={autoConfig}
          disabled={saving}
          icon={Sparkles}
          onToggle={toggleAuto}
        />
      </section>

      <section className="ww-panel space-y-2" aria-labelledby="roles-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UsersRound aria-hidden="true" size={17} />
            <h2 id="roles-heading" className="ww-section-label">{t('components.admin.roles')}</h2>
          </div>
          <span className={`ww-status-chip ${diff === 0 ? 'is-success' : diff > 0 ? 'is-danger' : 'is-warning'}`}>
            {total} / {playerCount}
          </span>
        </div>

        {CONFIGURABLE_ROLES.map(role => {
          const count = config[role] ?? 0
          const max = role === 'werewolf' ? Math.max(1, Math.floor((playerCount - 1) / 2)) : (MAX_ROLE_COUNT[role] ?? playerCount)
          const roleLabel = t(`roles.${role}`)
          return (
            <div key={role} className="flex min-h-13 items-center justify-between gap-3 border-b border-white/6 py-2 last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="ww-role-icon" data-role={role}>
                  <RoleIcon role={role} size={19} aria-hidden="true" />
                </span>
                <span className="truncate text-sm font-medium text-[var(--ww-text)]">{roleLabel}</span>
              </div>
              <div className="flex items-center gap-1.5" aria-label={`${roleLabel}: ${count}`}>
                <button
                  type="button"
                  disabled={autoConfig || saving || count === 0}
                  onClick={() => adjust(role, -1)}
                  className="ww-icon-button"
                  aria-label={t('components.admin.decreaseRole', { role: roleLabel })}
                >
                  <Minus aria-hidden="true" size={17} />
                </button>
                <output className="w-9 text-center font-semibold tabular-nums text-[var(--ww-text)]" aria-live="polite">
                  {count}
                </output>
                <button
                  type="button"
                  disabled={autoConfig || saving || count >= max}
                  onClick={() => adjust(role, 1)}
                  className="ww-icon-button"
                  aria-label={t('components.admin.increaseRole', { role: roleLabel })}
                >
                  <Plus aria-hidden="true" size={17} />
                </button>
              </div>
            </div>
          )
        })}

        <div className="flex min-h-13 items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="ww-role-icon" data-role="villager">
              <RoleIcon role="villager" size={19} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-[var(--ww-text-muted)]">{t('roles.villager')}</span>
          </div>
          <span className="w-9 text-center font-semibold tabular-nums text-[var(--ww-text-muted)]">{config.villager}</span>
        </div>
      </section>

      <div className="ww-surface-strong p-3 text-center" role="status" aria-live="polite">
        <p className={`text-sm font-medium ${ready ? 'text-[var(--ww-success)]' : 'text-[var(--ww-text-muted)]'}`}>
          {readinessText}
        </p>
      </div>

      <button
        type="button"
        disabled={!ready || starting || saving}
        onClick={handleStart}
        className="ww-button ww-button-primary w-full"
      >
        {starting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" fill="currentColor" />}
        <span>{starting ? t('components.admin.preparing') : t('components.admin.start')}</span>
      </button>
    </div>
  )
}

interface SettingSwitchProps {
  label: string
  description: string
  checked: boolean
  disabled: boolean
  icon: typeof Eye
  onToggle: () => void
}

function SettingSwitch({ label, description, checked, disabled, icon: Icon, onToggle }: SettingSwitchProps) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-t border-white/6 py-3 first:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 shrink-0 text-[var(--ww-text-muted)]" aria-hidden="true" size={18} />
        <div>
          <p className="text-sm font-medium text-[var(--ww-text)]">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--ww-text-subtle)]">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className="ww-switch shrink-0"
        data-state={checked ? 'on' : 'off'}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  )
}
