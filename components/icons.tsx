import type { SVGProps } from 'react'
import type { LucideIcon, LucideProps } from 'lucide-react'
import {
  Check,
  Church,
  CircleDot,
  Coins,
  Crosshair,
  Crown,
  Drama,
  Eye,
  FlaskConical,
  Heart,
  HeartPulse,
  House,
  Medal,
  Scale,
  ShieldCheck,
  Skull,
  Sparkles,
  Trophy,
  UserRound,
  Vote,
} from 'lucide-react'
import type { Role } from '@/types/game'

type AccessibleIconProps = Omit<LucideProps, 'aria-label' | 'ref'> & {
  label?: string
}

function accessibilityProps(label?: string) {
  return label
    ? { 'aria-label': label, role: 'img' as const }
    : { 'aria-hidden': true as const }
}

export function WolfMark({
  label,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  absoluteStrokeWidth,
  ...props
}: AccessibleIconProps) {
  const numericSize = typeof size === 'number' ? size : Number.parseFloat(size)
  const resolvedStrokeWidth = absoluteStrokeWidth && Number.isFinite(numericSize)
    ? (Number(strokeWidth) * 24) / numericSize
    : strokeWidth

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={resolvedStrokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...accessibilityProps(label)}
      {...(props as SVGProps<SVGSVGElement>)}
    >
      {label && <title>{label}</title>}
      <path d="M4 3.5 8.3 7A8 8 0 0 1 12 6a8 8 0 0 1 3.7 1L20 3.5l-1.1 6.8A7 7 0 0 1 20 14c0 4-3.6 7-8 7s-8-3-8-7a7 7 0 0 1 1.1-3.7Z" />
      <path d="m8 12 2 1m6-1-2 1m-4.5 4c1.7 1.3 3.3 1.3 5 0M12 14.5V17" />
    </svg>
  )
}

const ROLE_ICON_COMPONENTS: Partial<Record<Role, LucideIcon>> = {
  villager: House,
  witch: FlaskConical,
  seer: Eye,
  hunter: Crosshair,
  amor: Heart,
  fool: Drama,
  girl: UserRound,
  priest: Church,
}

export function RoleIcon({ role, label, ...props }: AccessibleIconProps & { role: Role }) {
  if (role === 'werewolf') return <WolfMark label={label} {...props} />

  const Icon = ROLE_ICON_COMPONENTS[role] ?? CircleDot
  return <Icon focusable="false" {...accessibilityProps(label)} {...props} />
}

const UI_ICON_COMPONENTS = {
  check: Check,
  coins: Coins,
  crown: Crown,
  medal: Medal,
  scale: Scale,
  skull: Skull,
  sparkles: Sparkles,
  trophy: Trophy,
  vote: Vote,
} satisfies Record<string, LucideIcon>

export type UiIconName = keyof typeof UI_ICON_COMPONENTS

export function UiIcon({ name, label, ...props }: AccessibleIconProps & { name: UiIconName }) {
  const Icon = UI_ICON_COMPONENTS[name]
  return <Icon focusable="false" {...accessibilityProps(label)} {...props} />
}

const EVENT_ICON_COMPONENTS: Record<string, LucideIcon> = {
  death: Skull,
  heal: HeartPulse,
  poison: FlaskConical,
  vote: Vote,
  bless: ShieldCheck,
  peek_caught: Eye,
  win: Trophy,
  mayor_elected: Crown,
  mayor_passed: Crown,
  fool_revealed: Drama,
}

export function EventIcon({ eventType, label, ...props }: AccessibleIconProps & { eventType: string }) {
  const Icon = EVENT_ICON_COMPONENTS[eventType] ?? CircleDot
  return <Icon focusable="false" {...accessibilityProps(label)} {...props} />
}
