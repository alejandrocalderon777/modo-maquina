interface MacroRingProps {
  label: string
  consumed: number
  target: number
  color: string
  unit?: string
  size?: number
}

export function MacroRing({ label, consumed, target, color, unit = 'g', size = 64 }: MacroRingProps) {
  const pct = Math.min(consumed / target, 1)
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#252933"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="progress-ring-circle"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-mono font-bold" style={{ color }}>
            {consumed}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-mono text-gray-600">/{target}{unit}</p>
      </div>
    </div>
  )
}

interface CalorieRingProps {
  consumed: number
  target: number
  size?: number
}

export function CalorieRing({ consumed, target, size = 120 }: CalorieRingProps) {
  const pct = Math.min(consumed / target, 1)
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1C1F28"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#CEFF3C"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-2xl text-volt">{consumed}</span>
        <span className="font-mono text-xs text-gray-500">/{target}</span>
        <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">kcal</span>
      </div>
    </div>
  )
}
