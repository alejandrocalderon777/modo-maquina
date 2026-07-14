import type { Archetype, Lineage } from '../types'
import { LINEAGES } from '../assets/data'
import clsx from 'clsx'

interface AvatarDisplayProps {
  archetype?: Archetype
  lineage?: Lineage
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  className?: string
}

const ARCHETYPE_EMOJI: Record<Archetype, string> = {
  runner: '🏃',
  builder: '💪',
  fitness: '⚡',
  warrior: '⚔️',
}

const ARCHETYPE_COLOR: Record<Archetype, string> = {
  runner: '#CEFF3C',
  builder: '#E23A2E',
  fitness: '#6FD3E8',
  warrior: '#DE782C',
}

const SIZE_MAP = {
  sm: { outer: 'w-12 h-12', emoji: 'text-2xl', ring: 'w-14 h-14' },
  md: { outer: 'w-20 h-20', emoji: 'text-4xl', ring: 'w-24 h-24' },
  lg: { outer: 'w-28 h-28', emoji: 'text-5xl', ring: 'w-32 h-32' },
  xl: { outer: 'w-36 h-36', emoji: 'text-6xl', ring: 'w-40 h-40' },
}

export default function AvatarDisplay({
  archetype = 'runner',
  lineage = 'spartan',
  size = 'md',
  animated = false,
  className,
}: AvatarDisplayProps) {
  const lineageConfig = LINEAGES.find((l) => l.id === lineage)
  const accentColor = lineageConfig?.color || '#CEFF3C'
  const sizes = SIZE_MAP[size]

  return (
    <div className={clsx('relative flex items-center justify-center', className)}>
      {/* Outer glow ring */}
      <div
        className={clsx('absolute rounded-full', sizes.ring, animated && 'animate-glow')}
        style={{
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          border: `2px solid ${accentColor}55`,
        }}
      />
      {/* Avatar circle */}
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center',
          sizes.outer,
          animated && 'animate-bounce-in'
        )}
        style={{
          background: `radial-gradient(circle at 30% 30%, #2a2d38, #111318)`,
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 20px ${accentColor}44`,
        }}
      >
        <span className={sizes.emoji}>{ARCHETYPE_EMOJI[archetype]}</span>

        {/* Lineage emblem (small badge) */}
        {lineage && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs border border-carbon"
            style={{ background: accentColor }}
          >
            {lineageConfig?.emblem}
          </div>
        )}
      </div>

      {/* Energy particles (animated) */}
      {animated && (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full animate-ping"
              style={{
                background: accentColor,
                top: `${[15, 60, 80][i]}%`,
                left: `${[80, 5, 75][i]}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s',
                opacity: 0.6,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

// Simple placeholder avatar for onboarding (before lineage is chosen)
export function DefaultAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = SIZE_MAP[size]
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center border-2 border-volt',
        sizes.outer
      )}
      style={{
        background: 'radial-gradient(circle at 30% 30%, #1e2130, #111318)',
        boxShadow: '0 0 20px rgba(206,255,60,0.3)',
      }}
    >
      <span className={sizes.emoji}>🤖</span>
    </div>
  )
}
