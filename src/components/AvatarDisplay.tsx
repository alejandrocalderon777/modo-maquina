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

export const ARCHETYPE_COLOR: Record<Archetype, string> = {
  runner: '#CEFF3C',
  builder: '#E23A2E',
  fitness: '#6FD3E8',
  warrior: '#DE782C',
}

/* ── Lineage Emblems SVG ───────────────────────────────────────────── */

export function LineageEmblemSVG({ lineage, size = 24 }: { lineage: string; size?: number }) {
  if (lineage === 'spartan') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Spartan helmet - side profile */}
        <path d="M7 4 Q12 1 17 4 L17 11 Q17 16 12 18 L10 23 L8 18 Q4 15 4 11 L4 4 Z" fill="currentColor" />
        <path d="M4 7 L1 10 L3 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <rect x="6" y="9" width="9" height="3" rx="1.5" fill="black" opacity="0.45" />
        {/* Crest */}
        <path d="M7 4 Q12 1 17 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  if (lineage === 'viking') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Runic R (Raidō) - ᚱ */}
        <line x1="7" y1="2" x2="7" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7 2 L16 2 Q20 2 20 7.5 Q20 13 7 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="7" y1="13" x2="19" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (lineage === 'mapuche') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Wenufoye / Sol mapuche - sun wheel */}
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
        <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5.9" y1="5.9" x2="18.1" y2="18.1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="18.1" y1="5.9" x2="5.9" y2="18.1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return null
}

/* ── Character SVG Illustrations ──────────────────────────────────── */

export function RunnerSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1A1D26" />
      {/* Head */}
      <ellipse cx="63" cy="18" rx="9" ry="10" fill="#7B4A22" />
      <ellipse cx="63" cy="10" rx="9" ry="5" fill="#2C1A0E" />
      {/* Torso - lean, forward lean */}
      <path d="M59 28 L51 56 L61 56 L67 28 Z" fill="#1A1A3A" />
      {/* Left arm - forward punch */}
      <path d="M59 32 L39 43" stroke="#7B4A22" strokeWidth="5.5" strokeLinecap="round" />
      {/* Right arm - back */}
      <path d="M66 34 L79 49" stroke="#7B4A22" strokeWidth="5.5" strokeLinecap="round" />
      {/* Right leg - stride forward */}
      <path d="M53 56 L34 73 L39 77" stroke="#7B4A22" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left leg - push off */}
      <path d="M61 56 L69 74 L78 81" stroke="#7B4A22" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shorts */}
      <path d="M51 55 L48 67 L63 67 L63 55 Z" fill="#CEFF3C" opacity="0.9" />
      {/* Shoes */}
      <ellipse cx="37" cy="78" rx="6.5" ry="3" fill="#222" />
      <ellipse cx="78" cy="82" rx="6.5" ry="3" fill="#222" />
      {/* Speed lines */}
      <line x1="20" y1="55" x2="32" y2="55" stroke="#CEFF3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="17" y1="62" x2="29" y2="62" stroke="#CEFF3C" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

export function BuilderSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1A1D26" />
      {/* Head */}
      <ellipse cx="50" cy="15" rx="12" ry="12" fill="#C27A4A" />
      {/* Neck */}
      <rect x="44" y="25" width="12" height="9" fill="#C27A4A" />
      {/* MASSIVE torso - extreme V-taper */}
      <path d="M16 34 L84 34 L67 72 L33 72 Z" fill="#2C3E50" />
      {/* Chest separation */}
      <line x1="50" y1="34" x2="50" y2="60" stroke="#1A1D26" strokeWidth="2" opacity="0.4" />
      {/* Pec definition */}
      <path d="M22 44 Q35 50 50 46 Q65 50 78 44" stroke="#3A5268" strokeWidth="2" fill="none" opacity="0.6" />
      {/* LEFT HUGE BICEP */}
      <circle cx="14" cy="45" r="14" fill="#C27A4A" />
      <ellipse cx="14" cy="58" rx="9" ry="8" fill="#C27A4A" />
      <path d="M8 56 L14 70" stroke="#C27A4A" strokeWidth="10" strokeLinecap="round" />
      {/* RIGHT HUGE BICEP */}
      <circle cx="86" cy="45" r="14" fill="#C27A4A" />
      <ellipse cx="86" cy="58" rx="9" ry="8" fill="#C27A4A" />
      <path d="M92 56 L86 70" stroke="#C27A4A" strokeWidth="10" strokeLinecap="round" />
      {/* Vein on arm */}
      <path d="M10 48 Q14 52 12 58" stroke="#A0603A" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
      {/* Legs */}
      <path d="M35 72 L30 94" stroke="#C27A4A" strokeWidth="11" strokeLinecap="round" />
      <path d="M65 72 L70 94" stroke="#C27A4A" strokeWidth="11" strokeLinecap="round" />
      {/* Shorts */}
      <path d="M33 70 L36 84 L50 84 L50 70 Z" fill="#E23A2E" />
      <path d="M67 70 L64 84 L50 84 L50 70 Z" fill="#E23A2E" />
    </svg>
  )
}

export function FitnessSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1A1D26" />
      {/* Hair */}
      <path d="M35 15 Q36 6 50 4 Q64 6 65 15 L68 28 Q60 20 50 20 Q40 20 32 28 Z" fill="#2D1A0A" />
      {/* Head */}
      <ellipse cx="50" cy="18" rx="12" ry="13" fill="#D4956A" />
      {/* Neck */}
      <rect x="45" y="29" width="10" height="7" fill="#D4956A" />
      {/* Torso - Athletic hourglass */}
      <path d="M32 36 L68 36 L62 56 L70 74 L30 74 L38 56 Z" fill="#1E3A5F" />
      {/* Waist indent lines */}
      <line x1="38" y1="54" x2="62" y2="54" stroke="#6FD3E8" strokeWidth="1.5" opacity="0.4" />
      {/* Defined abs lines */}
      <line x1="46" y1="60" x2="46" y2="70" stroke="#16305A" strokeWidth="1.5" opacity="0.5" />
      <line x1="54" y1="60" x2="54" y2="70" stroke="#16305A" strokeWidth="1.5" opacity="0.5" />
      {/* Sports top accent */}
      <path d="M32 36 L44 36 L40 52 L34 52 Z" fill="#6FD3E8" opacity="0.7" />
      <path d="M68 36 L56 36 L60 52 L66 52 Z" fill="#6FD3E8" opacity="0.7" />
      {/* Left arm - toned */}
      <path d="M32 38 L20 56" stroke="#D4956A" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M20 56 L24 68" stroke="#D4956A" strokeWidth="6.5" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M68 38 L80 56" stroke="#D4956A" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M80 56 L76 68" stroke="#D4956A" strokeWidth="6.5" strokeLinecap="round" />
      {/* Legs */}
      <path d="M38 74 L34 94" stroke="#D4956A" strokeWidth="9.5" strokeLinecap="round" />
      <path d="M62 74 L66 94" stroke="#D4956A" strokeWidth="9.5" strokeLinecap="round" />
      {/* Leggings */}
      <path d="M30 72 L34 90 L50 90 L50 72 Z" fill="#1A1A3E" opacity="0.7" />
      <path d="M70 72 L66 90 L50 90 L50 72 Z" fill="#1A1A3E" opacity="0.7" />
      {/* Ponytail */}
      <path d="M63 12 Q72 10 74 20 Q73 28 68 24" stroke="#2D1A0A" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function WarriorSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#1A1D26" />
      {/* Helmet crest / plume */}
      <path d="M36 6 Q50 1 64 6 L60 20 L40 20 Z" fill="#7A1A1A" />
      <path d="M43 5 Q50 2 57 5 L55 20 L45 20 Z" fill="#CC2222" />
      {/* Spartan helmet */}
      <path d="M28 20 Q28 8 50 8 Q72 8 72 20 L72 40 Q72 46 50 46 Q28 46 28 40 Z" fill="#8A8A8A" />
      {/* Cheek guards */}
      <path d="M28 25 L23 38 L32 40 L32 25 Z" fill="#6A6A6A" />
      <path d="M72 25 L77 38 L68 40 L68 25 Z" fill="#6A6A6A" />
      {/* Eye slit */}
      <rect x="33" y="27" width="34" height="6" rx="3" fill="#111318" />
      {/* Nose guard */}
      <rect x="47" y="27" width="6" height="16" rx="3" fill="#7A7A7A" />
      {/* Helmet gold trim */}
      <path d="M28 20 Q28 8 50 8 Q72 8 72 20" stroke="#C9A227" strokeWidth="3" fill="none" />
      {/* Armor - muscle cuirass */}
      <path d="M24 46 L76 46 L72 84 L28 84 Z" fill="#7A7A7A" />
      {/* Pectoral muscles on armor */}
      <ellipse cx="40" cy="56" rx="10" ry="8" fill="#8A8A8A" />
      <ellipse cx="60" cy="56" rx="10" ry="8" fill="#8A8A8A" />
      {/* Abs grid on armor */}
      <rect x="42" y="66" width="7" height="6" rx="2" fill="#6A6A6A" />
      <rect x="51" y="66" width="7" height="6" rx="2" fill="#6A6A6A" />
      {/* Gold trim */}
      <line x1="24" y1="46" x2="76" y2="46" stroke="#C9A227" strokeWidth="2.5" />
      <line x1="28" y1="84" x2="72" y2="84" stroke="#C9A227" strokeWidth="2.5" />
      {/* Red cape */}
      <path d="M24 48 L10 84 L26 80 L28 84" stroke="#7A1A1A" strokeWidth="9" strokeLinecap="round" />
      <path d="M76 48 L90 84 L74 80 L72 84" stroke="#7A1A1A" strokeWidth="9" strokeLinecap="round" />
      {/* Greaved legs */}
      <path d="M32 84 L28 97" stroke="#7A7A7A" strokeWidth="11" strokeLinecap="round" />
      <path d="M68 84 L72 97" stroke="#7A7A7A" strokeWidth="11" strokeLinecap="round" />
      {/* Gold greave band */}
      <line x1="25" y1="90" x2="33" y2="90" stroke="#C9A227" strokeWidth="2.5" />
      <line x1="67" y1="90" x2="75" y2="90" stroke="#C9A227" strokeWidth="2.5" />
    </svg>
  )
}

/* ── Character map ────────────────────────────────────────────────── */

const SIZE_PX: Record<string, number> = { sm: 42, md: 64, lg: 96, xl: 120 }
const RING_PX: Record<string, number> = { sm: 56, md: 82, lg: 116, xl: 144 }

export function CharacterSVG({ archetype, sizePx }: { archetype: Archetype; sizePx: number }) {
  if (archetype === 'runner') return <RunnerSVG size={sizePx} />
  if (archetype === 'builder') return <BuilderSVG size={sizePx} />
  if (archetype === 'fitness') return <FitnessSVG size={sizePx} />
  return <WarriorSVG size={sizePx} />
}

/* ── Main component ───────────────────────────────────────────────── */

export default function AvatarDisplay({
  archetype = 'runner',
  lineage,
  size = 'md',
  animated = false,
  className,
}: AvatarDisplayProps) {
  const lineageConfig = lineage ? LINEAGES.find((l) => l.id === lineage) : null
  const accentColor = lineageConfig?.color || ARCHETYPE_COLOR[archetype]
  const sizePx = SIZE_PX[size]
  const ringPx = RING_PX[size]

  return (
    <div className={clsx('relative flex items-center justify-center', className)}>
      {/* Glow ring */}
      <div
        className={clsx('absolute rounded-full', animated && 'animate-glow')}
        style={{
          width: ringPx,
          height: ringPx,
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          border: `2px solid ${accentColor}55`,
        }}
      />

      {/* Character */}
      <div
        className={clsx('relative rounded-full overflow-hidden', animated && 'animate-bounce-in')}
        style={{
          width: sizePx,
          height: sizePx,
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 16px ${accentColor}44`,
        }}
      >
        <CharacterSVG archetype={archetype} sizePx={sizePx} />
      </div>

      {/* Lineage emblem badge */}
      {lineage && (
        <div
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center border-2 border-carbon"
          style={{
            width: sizePx * 0.38,
            height: sizePx * 0.38,
            background: accentColor,
            color: '#111318',
          }}
        >
          <LineageEmblemSVG lineage={lineage} size={sizePx * 0.22} />
        </div>
      )}

      {/* Energy particles */}
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

export function DefaultAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizePx = SIZE_PX[size]
  return (
    <div
      className="rounded-full overflow-hidden border-2 border-volt"
      style={{
        width: sizePx,
        height: sizePx,
        boxShadow: '0 0 20px rgba(206,255,60,0.3)',
      }}
    >
      <WarriorSVG size={sizePx} />
    </div>
  )
}
