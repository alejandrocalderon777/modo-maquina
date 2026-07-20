import type { Verdict, Grade } from '../utils/nutriScore'
import { GRADE_COLORS } from '../utils/nutriScore'

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E']

interface Props {
  verdict: Verdict
  coachLine?: string        // avatar's take
  compact?: boolean
  nova?: number
}

export function NutriVerdict({ verdict, coachLine, compact = false, nova }: Props) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold"
        style={{ background: `${verdict.color}22`, color: verdict.color, fontSize: '10px' }}>
        <span style={{ fontSize: '11px' }}>{verdict.grade}</span>
        {verdict.label}
      </span>
    )
  }

  return (
    <div className="rounded-xl p-3" style={{ background: '#1C1F28', border: `1px solid ${verdict.color}44` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Calidad nutricional</p>
        <span className="font-mono text-gray-600" style={{ fontSize: '9px' }}>
          {verdict.source === 'oficial' ? 'Nutri-Score oficial' : 'estimado'}
        </span>
      </div>

      {/* Traffic light scale A–E */}
      <div className="flex gap-1 mb-2.5">
        {GRADES.map(g => {
          const active = g === verdict.grade
          return (
            <div key={g} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded" style={{
                height: active ? 26 : 16,
                background: active ? GRADE_COLORS[g] : `${GRADE_COLORS[g]}33`,
                border: active ? `2px solid #fff` : 'none',
                transition: 'all .2s',
              }} />
              <span className="font-mono font-bold" style={{
                fontSize: active ? '12px' : '10px',
                color: active ? GRADE_COLORS[g] : '#555',
              }}>{g}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="font-display font-black text-xl" style={{ color: verdict.color }}>
          {verdict.label}
        </span>
        {nova === 4 && (
          <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: '#E23A2E22', color: '#E23A2E', fontSize: '9px' }}>
            ultraprocesado
          </span>
        )}
      </div>

      <ul className="space-y-0.5 mb-1">
        {verdict.reasons.map((r, i) => (
          <li key={i} className="text-gray-400 text-xs font-body leading-relaxed">· {r}</li>
        ))}
      </ul>

      {coachLine && (
        <p className="text-white text-xs font-body italic mt-2 pt-2 border-t border-gray-800 leading-relaxed">
          "{coachLine}"
        </p>
      )}
    </div>
  )
}
