import type { AppState } from '../types'

interface Props {
  accentColor: string
  avatarSrc: string
  lineageName: string
  onClose: () => void
  state: AppState
}

const dayStr = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() - offset)
  return d.toISOString().split('T')[0]
}
const rangeDays = (start: number, end: number) => {
  const days: string[] = []
  for (let i = start; i > end; i--) days.push(dayStr(i))
  return days
}

export function WeeklyReview({ accentColor, avatarSrc, lineageName, onClose, state }: Props) {
  const wc = state.workoutCompletions || {}
  const exDone = (d: string) => (wc[d]?.length || 0) > 0
  const hasFood = (d: string) => state.foodLog.some(e => e.date === d)

  const thisWeek = rangeDays(6, -1)   // últimos 7 días (0..6)
  const lastWeek = rangeDays(13, 6)   // 7 días anteriores

  const wodThis = thisWeek.filter(exDone).length
  const wodLast = lastWeek.filter(exDone).length
  const foodThis = thisWeek.filter(hasFood).length
  const foodLast = lastWeek.filter(hasFood).length

  // Peso: primer y último registro dentro del historial
  const hist = state.measurementHistory || []
  const weightNow = hist.length ? hist[hist.length - 1].weight : state.measurements.weight
  const weightPrev = hist.length >= 2 ? hist[0].weight : undefined
  const weightDelta = weightNow && weightPrev ? +(weightNow - weightPrev).toFixed(1) : null

  const goal = state.profile.goal

  // ── Narración del avatar: interpreta + propone acción ──
  const lines: string[] = []
  const name = state.profile.name?.split(' ')[0] || ''

  if (wodThis > wodLast)      lines.push(`Subiste de ${wodLast} a ${wodThis} entrenamientos esta semana. Eso es progreso real${name ? ', ' + name : ''}.`)
  else if (wodThis < wodLast) lines.push(`Bajaste de ${wodLast} a ${wodThis} entrenamientos. Pasa — lo importante es volver esta semana.`)
  else if (wodThis > 0)       lines.push(`Mantuviste tus ${wodThis} entrenamientos, igual que la semana pasada. La constancia es la que construye.`)
  else                        lines.push(`No registraste entrenamientos esta semana. Empecemos suave: un entreno exprés de 15 min hoy y arrancamos.`)

  if (foodThis >= 6)          lines.push(`Registraste tu comida ${foodThis}/7 días. Vas con el ojo puesto en la alimentación.`)
  else if (foodThis > 0)      lines.push(`Registraste comida solo ${foodThis}/7 días. Anotar lo que comes es la mitad del resultado.`)

  if (weightDelta !== null) {
    const losing = goal === 'lose_weight'
    if (Math.abs(weightDelta) < 0.3) lines.push(`Tu peso se mantuvo (${weightNow}kg). Si buscas cambio, toca ajustar calorías o estímulo.`)
    else if ((losing && weightDelta < 0) || (goal === 'gain_muscle' && weightDelta > 0))
      lines.push(`Tu peso se movió ${weightDelta > 0 ? '+' : ''}${weightDelta}kg en la dirección de tu objetivo. Vas bien encaminado.`)
    else lines.push(`Tu peso cambió ${weightDelta > 0 ? '+' : ''}${weightDelta}kg. Revisemos si va con tu objetivo.`)
  }

  // Acción propuesta (siempre una)
  let action = ''
  if (wodThis === 0) action = 'Esta semana: haz al menos 2 entrenamientos, aunque sean exprés.'
  else if (wodThis <= wodLast) action = `Meta de esta semana: supera tus ${Math.max(wodThis, wodLast)} entrenamientos anteriores.`
  else if (foodThis < 6) action = 'Esta semana: registra tu comida al menos 6 de 7 días.'
  else action = 'Vas muy bien. Sube un poco la carga o suma una variante nueva para seguir progresando.'

  const stats = [
    { l:'Entrenos', v:wodThis, prev:wodLast, c:accentColor },
    { l:'Días con comida', v:foodThis, prev:foodLast, c:'#E23A2E' },
    { l:'Racha', v:state.streakDays, prev:null, c:'#6FD3E8' },
  ]

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 65, background:'#111318' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
        <div className="w-12" />
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Ritual de avances</p>
        <button onClick={onClose} className="text-gray-500 font-mono text-sm">Listo</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <h2 className="font-display font-black text-2xl text-white uppercase leading-tight mb-1">Tu semana</h2>
        <p className="text-gray-500 text-sm font-body mb-5">Esto es lo que lograste en los últimos 7 días.</p>

        {/* Stats con comparación */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {stats.map(s => {
            const trend = s.prev !== null ? s.v - s.prev : null
            return (
              <div key={s.l} className="rounded-2xl p-3 text-center" style={{ background:'#1C1F28' }}>
                <p className="font-display font-black text-2xl" style={{ color:s.c }}>{s.v}</p>
                <p className="font-mono text-gray-500 mt-0.5" style={{ fontSize:'9px' }}>{s.l}</p>
                {trend !== null && trend !== 0 && (
                  <p className="font-mono mt-0.5" style={{ fontSize:'9px', color: trend > 0 ? '#7AC943' : '#E23A2E' }}>
                    {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {weightDelta !== null && (
          <div className="rounded-2xl p-3 mb-5 flex items-center justify-between" style={{ background:'#1C1F28' }}>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Peso</p>
            <div className="text-right">
              <span className="font-display font-black text-xl text-white">{weightNow}kg</span>
              <span className="font-mono text-xs ml-2" style={{ color: weightDelta === 0 ? '#888' : weightDelta < 0 ? '#7AC943' : '#DE782C' }}>
                {weightDelta > 0 ? '+' : ''}{weightDelta}kg
              </span>
            </div>
          </div>
        )}

        {/* Avatar narrando */}
        <div className="rounded-2xl p-4 mb-4" style={{ background:`linear-gradient(135deg, ${accentColor}12, ${accentColor}05)`, border:`1px solid ${accentColor}33` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width:44, height:44, border:`2px solid ${accentColor}` }}>
              <img src={avatarSrc} alt="Coach" className="w-full h-full object-cover" />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color:accentColor }}>Coach · {lineageName}</p>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <p key={i} className="text-white text-sm font-body leading-relaxed">{l}</p>
            ))}
          </div>
        </div>

        {/* Acción propuesta */}
        <div className="rounded-2xl p-4" style={{ background:accentColor }}>
          <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color:'#111318' }}>Tu misión</p>
          <p className="font-display font-bold text-base" style={{ color:'#111318' }}>{action}</p>
        </div>

        <button onClick={onClose} className="w-full mt-5 py-3 font-mono text-sm text-gray-600">Cerrar</button>
      </div>
    </div>
  )
}
