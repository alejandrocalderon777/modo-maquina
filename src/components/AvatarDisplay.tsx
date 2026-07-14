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
        <path d="M7 4 Q12 1 17 4 L17 11 Q17 16 12 18 L10 23 L8 18 Q4 15 4 11 L4 4 Z" fill="currentColor" />
        <path d="M4 7 L1 10 L3 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <rect x="6" y="9" width="9" height="3" rx="1.5" fill="black" opacity="0.45" />
        <path d="M7 4 Q12 1 17 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  if (lineage === 'viking') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <line x1="7" y1="2" x2="7" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7 2 L16 2 Q20 2 20 7.5 Q20 13 7 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="7" y1="13" x2="19" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (lineage === 'mapuche') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

/* ── FLAT DESIGN Character SVGs ───────────────────────────────────── */

export function WarriorSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#1A1D26" />

      {/* SPEAR shaft */}
      <rect x="69" y="6" width="5" height="78" rx="2.5" fill="#8B6347" />
      {/* SPEAR tip */}
      <polygon points="71.5,2 65,20 78,20" fill="#C8C8C8" />

      {/* RED CAPE behind body */}
      <path d="M32 40 Q14 65 18 97 L52 97 L52 40 Z" fill="#CC2200" />
      <path d="M68 40 Q80 60 78 85 L66 68 Z" fill="#CC2200" />

      {/* BODY — dark teal tunic */}
      <path d="M28 40 L72 40 L68 80 L32 80 Z" fill="#3B5268" />

      {/* BELT */}
      <rect x="27" y="70" width="46" height="9" rx="3" fill="#3A2510" />
      <rect x="46" y="72" width="8" height="5" rx="1" fill="#8A7A5A" />

      {/* SHIELD — round with pinwheel */}
      <circle cx="18" cy="62" r="19" fill="#8A9BA8" />
      <circle cx="18" cy="62" r="15" fill="#B0BEC8" />
      <path d="M18 47 Q28 54 18 62" stroke="#CC2200" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M18 77 Q8 70 18 62" stroke="#CC2200" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M3 62 Q10 52 18 62" stroke="#CC2200" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M33 62 Q26 72 18 62" stroke="#CC2200" strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="62" r="5" fill="#8A9BA8" />

      {/* Left arm — shield arm */}
      <rect x="27" y="50" width="9" height="18" rx="4.5" fill="#F5A623" />

      {/* Right arm — spear arm */}
      <rect x="64" y="46" width="9" height="18" rx="4.5" fill="#F5A623" />

      {/* NECK */}
      <rect x="44" y="26" width="12" height="16" rx="4" fill="#F5A623" />

      {/* HELMET */}
      <path d="M26 24 Q26 8 50 8 Q74 8 74 24 L74 36 Q68 42 50 44 Q32 42 26 36 Z" fill="#5D6B7A" />
      {/* Helmet brim band */}
      <rect x="24" y="24" width="52" height="7" rx="3.5" fill="#4A5868" />
      {/* Nose guard */}
      <rect x="47" y="29" width="6" height="16" rx="3" fill="#4A5868" />
      {/* Face skin */}
      <rect x="32" y="28" width="36" height="16" rx="5" fill="#F5A623" />

      {/* BOOTS / legs */}
      <rect x="32" y="80" width="16" height="18" rx="6" fill="#7A5040" />
      <rect x="52" y="80" width="16" height="18" rx="6" fill="#7A5040" />
      {/* Boot tops */}
      <rect x="30" y="78" width="20" height="6" rx="3" fill="#8A6050" />
      <rect x="50" y="78" width="20" height="6" rx="3" fill="#8A6050" />
    </svg>
  )
}

export function RunnerSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#1A1D26" />

      {/* Speed lines */}
      <line x1="4" y1="52" x2="20" y2="52" stroke="#CEFF3C" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <line x1="2" y1="62" x2="18" y2="62" stroke="#CEFF3C" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="72" x2="20" y2="72" stroke="#CEFF3C" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

      {/* Head */}
      <circle cx="64" cy="14" r="11" fill="#7B4A22" />
      {/* Hair */}
      <path d="M53 10 Q54 2 64 2 Q74 2 75 10 L74 16 Q64 6 53 16 Z" fill="#1A0800" />

      {/* Torso — slight forward lean */}
      <path d="M60 25 L56 54 L64 54 L68 25 Z" fill="#CEFF3C" />

      {/* Left arm — pumping forward */}
      <path d="M60 30 L42 42" stroke="#7B4A22" strokeWidth="7" strokeLinecap="round" />
      <path d="M42 42 L38 52" stroke="#7B4A22" strokeWidth="6" strokeLinecap="round" />

      {/* Right arm — back */}
      <path d="M66 30 L78 42" stroke="#7B4A22" strokeWidth="7" strokeLinecap="round" />
      <path d="M78 42 L82 52" stroke="#7B4A22" strokeWidth="6" strokeLinecap="round" />

      {/* Shorts */}
      <path d="M56 53 L53 66 L66 66 L66 53 Z" fill="#1A1A3A" />

      {/* Left leg — stride out front */}
      <path d="M55 54 L36 74 L42 78" stroke="#7B4A22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Right leg — push off back */}
      <path d="M63 54 L72 74 L80 80" stroke="#7B4A22" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />

      {/* LEFT shoe */}
      <ellipse cx="40" cy="79" rx="10" ry="5" fill="#FF3A00" />
      <rect x="30" y="76" width="20" height="6" rx="3" fill="#FF3A00" />
      {/* RIGHT shoe */}
      <ellipse cx="81" cy="81" rx="10" ry="5" fill="#FF3A00" />
      <rect x="71" y="78" width="20" height="6" rx="3" fill="#FF3A00" />
    </svg>
  )
}

export function BuilderSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#1A1D26" />

      {/* Head */}
      <circle cx="50" cy="13" r="12" fill="#C27A4A" />
      {/* Hair */}
      <path d="M38 9 Q38 1 50 1 Q62 1 62 9 L60 14 Q50 6 40 14 Z" fill="#2A1A08" />

      {/* Massive shoulders block */}
      <path d="M10 30 L90 30 L82 52 L18 52 Z" fill="#2C3E50" />

      {/* Chest */}
      <path d="M18 52 L82 52 L74 76 L26 76 Z" fill="#3A4E62" />

      {/* Chest line */}
      <line x1="50" y1="30" x2="50" y2="64" stroke="#1A2530" strokeWidth="2.5" opacity="0.5" />

      {/* Neck */}
      <rect x="44" y="23" width="12" height="10" rx="4" fill="#C27A4A" />

      {/* LEFT ARM — HUGE bicep flexed up */}
      <ellipse cx="9" cy="38" rx="12" ry="14" fill="#C27A4A" />
      <rect x="2" y="46" width="14" height="16" rx="7" fill="#C27A4A" />
      <path d="M5 58 L8 72" stroke="#C27A4A" strokeWidth="11" strokeLinecap="round" />
      {/* Vein */}
      <path d="M6 44 Q9 50 7 58" stroke="#A0603A" strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* RIGHT ARM — HUGE bicep flexed up */}
      <ellipse cx="91" cy="38" rx="12" ry="14" fill="#C27A4A" />
      <rect x="84" y="46" width="14" height="16" rx="7" fill="#C27A4A" />
      <path d="M95 58 L92 72" stroke="#C27A4A" strokeWidth="11" strokeLinecap="round" />
      <path d="M94 44 Q91 50 93 58" stroke="#A0603A" strokeWidth="1.5" fill="none" opacity="0.6" />

      {/* Belt */}
      <rect x="24" y="72" width="52" height="9" rx="4" fill="#3A2510" />
      <rect x="45" y="73" width="10" height="7" rx="2" fill="#7A6A4A" />

      {/* LEGS */}
      <rect x="28" y="81" width="18" height="18" rx="7" fill="#C27A4A" />
      <rect x="54" y="81" width="18" height="18" rx="7" fill="#C27A4A" />

      {/* Shorts */}
      <path d="M26 76 L30 90 L50 90 L50 76 Z" fill="#E23A2E" />
      <path d="M74 76 L70 90 L50 90 L50 76 Z" fill="#E23A2E" />
    </svg>
  )
}

export function FitnessSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#1A1D26" />

      {/* Ponytail */}
      <path d="M63 10 Q76 8 78 20 Q76 30 70 26" stroke="#2D1A0A" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* Hair */}
      <path d="M34 12 Q34 2 50 2 Q66 2 66 12 L64 24 Q56 16 50 16 Q44 16 36 24 Z" fill="#2D1A0A" />

      {/* Head */}
      <circle cx="50" cy="15" r="12" fill="#D4956A" />

      {/* Neck */}
      <rect x="45" y="25" width="10" height="10" rx="4" fill="#D4956A" />

      {/* TORSO — hourglass: wide shoulders, narrow waist, wider hips */}
      {/* Shoulders */}
      <path d="M26 35 L74 35 L68 52 L32 52 Z" fill="#1E3A5F" />
      {/* Waist */}
      <path d="M34 52 L66 52 L64 62 L36 62 Z" fill="#1A3050" />
      {/* Hips */}
      <path d="M30 62 L70 62 L66 76 L34 76 Z" fill="#1E3A5F" />

      {/* Sports crop top */}
      <path d="M30 35 L70 35 L66 50 L34 50 Z" fill="#6FD3E8" />
      {/* Top straps */}
      <rect x="36" y="25" width="6" height="12" rx="3" fill="#6FD3E8" />
      <rect x="58" y="25" width="6" height="12" rx="3" fill="#6FD3E8" />

      {/* LEFT ARM — toned, hands on hips */}
      <path d="M27 37 L16 52" stroke="#D4956A" strokeWidth="9" strokeLinecap="round" />
      <path d="M16 52 L20 66" stroke="#D4956A" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="22" cy="68" rx="6" ry="4" fill="#D4956A" />

      {/* RIGHT ARM */}
      <path d="M73 37 L84 52" stroke="#D4956A" strokeWidth="9" strokeLinecap="round" />
      <path d="M84 52 L80 66" stroke="#D4956A" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="78" cy="68" rx="6" ry="4" fill="#D4956A" />

      {/* LEGGINGS */}
      <rect x="30" y="76" width="18" height="22" rx="8" fill="#1A1A3E" />
      <rect x="52" y="76" width="18" height="22" rx="8" fill="#1A1A3E" />

      {/* Shoes */}
      <ellipse cx="39" cy="98" rx="11" ry="4" fill="#444" />
      <ellipse cx="61" cy="98" rx="11" ry="4" fill="#444" />
    </svg>
  )
}

/* ── Character map ────────────────────────────────────────────────── */
const SIZE_PX: Record<string, number> = { sm: 44, md: 68, lg: 96, xl: 124 }
const RING_PX: Record<string, number> = { sm: 58, md: 86, lg: 118, xl: 148 }

export function CharacterSVG({ archetype, sizePx }: { archetype: Archetype; sizePx: number }) {
  if (archetype === 'runner') return <RunnerSVG size={sizePx} />
  if (archetype === 'builder') return <BuilderSVG size={sizePx} />
  if (archetype === 'fitness') return <FitnessSVG size={sizePx} />
  return <WarriorSVG size={sizePx} />
}

/* ── Main AvatarDisplay ───────────────────────────────────────────── */
export default function AvatarDisplay({
  archetype = 'warrior',
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
      <div
        className="absolute rounded-full"
        style={{
          width: ringPx, height: ringPx,
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          border: `2px solid ${accentColor}55`,
        }}
      />
      <div
        className={clsx('relative rounded-full overflow-hidden', animated && 'animate-bounce-in')}
        style={{
          width: sizePx, height: sizePx,
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 16px ${accentColor}44`,
        }}
      >
        <CharacterSVG archetype={archetype} sizePx={sizePx} />
      </div>
      {lineage && (
        <div
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center border-2 border-carbon"
          style={{
            width: sizePx * 0.38, height: sizePx * 0.38,
            background: accentColor, color: '#111318',
          }}
        >
          <LineageEmblemSVG lineage={lineage} size={sizePx * 0.22} />
        </div>
      )}
      {animated && [0, 1, 2].map((i) => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-ping"
          style={{
            background: accentColor,
            top: `${[15, 60, 80][i]}%`, left: `${[80, 5, 75][i]}%`,
            animationDelay: `${i * 0.3}s`, animationDuration: '2s', opacity: 0.6,
          }} />
      ))}
    </div>
  )
}

export function DefaultAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizePx = SIZE_PX[size]
  return (
    <div className="rounded-full overflow-hidden border-2 border-volt"
      style={{ width: sizePx, height: sizePx, boxShadow: '0 0 20px rgba(206,255,60,0.3)' }}>
      <WarriorSVG size={sizePx} />
    </div>
  )
}
