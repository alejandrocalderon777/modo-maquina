import type { AppState } from '../types'

export interface AntiRoutineAlert {
  kind: 'monotonia' | 'estancamiento'
  title: string
  message: string
  suggestions: string[]
}

const THEME_WEEKS: Record<string, { name: string; desc: string }> = {
  spartan: { name: 'Prueba Espartana', desc: 'Semana de resistencia: circuitos largos y sin descanso' },
  viking:  { name: 'Semana Vikinga', desc: 'Entrena al aire libre y con frío, como un guerrero del norte' },
  mapuche: { name: 'Desafío del Newen', desc: 'Conecta con la tierra: entrena descalzo o en la naturaleza' },
}

// Detecta monotonía (~3 semanas activo constante) y estancamiento de peso
export function detectAntiRoutine(s: AppState): AntiRoutineAlert | null {
  const today = new Date().toISOString().split('T')[0]
  if (s.antiRoutineDismissed === today) return null

  // ── Estancamiento de peso ──
  const hist = s.measurementHistory || []
  if (hist.length >= 2) {
    const first = hist[0]
    const last = hist[hist.length - 1]
    const daysSpan = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000)
    const weightDelta = Math.abs(last.weight - first.weight)
    // 14+ días con menos de 0.6 kg de cambio = estancamiento
    if (daysSpan >= 14 && weightDelta < 0.6) {
      return {
        kind: 'estancamiento',
        title: 'Detecté un estancamiento',
        message: `Llevas ${daysSpan} días con el peso casi igual (${last.weight}kg). No es fracaso — es señal de que toca ajustar algo.`,
        suggestions: [
          'Sube o baja 150-200 kcal según tu objetivo',
          'Cambia el estímulo: nuevos ejercicios o más carga',
          'Revisa tu proteína y tu descanso',
        ],
      }
    }
  }

  // ── Monotonía de entrenamiento ──
  const wc = s.workoutCompletions || {}
  const activeDays = Object.keys(wc).filter(d => (wc[d]?.length || 0) > 0).sort()
  if (activeDays.length >= 12) {
    const firstDay = activeDays[0]
    const daysSince = Math.round((Date.now() - new Date(firstDay).getTime()) / 86400000)
    if (daysSince >= 21) {
      const theme = THEME_WEEKS[s.profile.lineage || 'spartan'] || THEME_WEEKS.spartan
      return {
        kind: 'monotonia',
        title: 'Tu rutina lleva 3 semanas igual',
        message: 'El cuerpo se adapta y la mente se aburre. Es el mejor momento para sacudir todo antes de que caiga la motivación.',
        suggestions: [
          `🔥 ${theme.name}: ${theme.desc}`,
          'Cambia los ejercicios de la biblioteca por variantes nuevas',
          'Suma un deporte distinto esta semana (pádel, natación, trote)',
        ],
      }
    }
  }

  return null
}
