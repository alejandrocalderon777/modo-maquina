import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { GOAL_LABELS } from '../utils/macros'
import type { Goal, WorkoutFocus } from '../types'

const PHASES: { goal: Goal; label: string; emoji: string; desc: string }[] = [
  { goal: 'lose_weight', label: 'Definición', emoji: '🔥', desc: 'Déficit — bajar grasa manteniendo músculo' },
  { goal: 'gain_muscle', label: 'Volumen',    emoji: '💪', desc: 'Superávit — ganar masa muscular' },
  { goal: 'health',      label: 'Mantención', emoji: '⚖️', desc: 'Calorías de mantenimiento' },
  { goal: 'endurance',   label: 'Resistencia', emoji: '⚡', desc: 'Combustible para rendimiento' },
]

const FOCUS_OPTIONS: WorkoutFocus[] = [
  'Tren superior', 'Tren inferior', 'Full body', 'Empuje', 'Tirón', 'Piernas', 'Cardio', 'Core', 'Descanso',
]

const FOCUS_EMOJI: Record<WorkoutFocus, string> = {
  'Tren superior': '💪', 'Tren inferior': '🦵', 'Full body': '🏋️', 'Empuje': '⬆️',
  'Tirón': '⬇️', 'Piernas': '🦵', 'Cardio': '🏃', 'Core': '🔥', 'Descanso': '😴',
}

export function MiPlan({ accent, onClose }: { accent: string; onClose: () => void }) {
  const profile      = useAppStore((s) => s.profile)
  const measurements = useAppStore((s) => s.measurements)
  const macros       = useAppStore((s) => s.macros)
  const weekPlan     = useAppStore((s) => s.weekPlan)
  const changePhase  = useAppStore((s) => s.changePhase)
  const adjustCalories = useAppStore((s) => s.adjustCalories)
  const setWeekDay   = useAppStore((s) => s.setWeekDay)

  const [tab, setTab] = useState<'nutricion' | 'entrenamiento'>('nutricion')
  const [editDay, setEditDay] = useState<number | null>(null)

  const currentGoal = profile.goal || 'health'
  const trainingDays = weekPlan.filter(d => d.focus !== 'Descanso').length
  const missingMeasures = !measurements.weight || !measurements.height

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
         onClick={onClose}>
      <div className="w-full sm:max-w-md bg-[#16191F] rounded-t-3xl sm:rounded-3xl border border-gray-800 max-h-[92vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>

        <div className="sticky top-0 bg-[#16191F] px-5 pt-5 pb-3 border-b border-gray-800 z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: accent }}>Mi Plan</p>
              <h2 className="font-display text-xl text-white mt-0.5">Dónde estás hoy</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 text-2xl leading-none px-2">&times;</button>
          </div>

          <div className="flex gap-2 mt-4">
            {(['nutricion', 'entrenamiento'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 font-mono text-xs py-2 rounded-lg transition-colors"
                style={{
                  background: tab === t ? accent : `${accent}14`,
                  color: tab === t ? '#111318' : accent,
                }}>
                {t === 'nutricion' ? '🍽️ Nutrición' : '🏋️ Entrenamiento'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'nutricion' && (
          <div className="p-5 space-y-5">
            <div>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-wider mb-2">Tu fase</p>
              <div className="grid grid-cols-2 gap-2">
                {PHASES.map(p => {
                  const active = currentGoal === p.goal
                  return (
                    <button key={p.goal} onClick={() => changePhase(p.goal)}
                      className="text-left p-3 rounded-xl border transition-all"
                      style={{
                        background: active ? `${accent}18` : '#1C2028',
                        borderColor: active ? accent : 'transparent',
                      }}>
                      <div className="flex items-center gap-1.5">
                        <span>{p.emoji}</span>
                        <span className="font-display text-sm text-white">{p.label}</span>
                      </div>
                      <p className="font-body text-[11px] text-gray-500 mt-1 leading-tight">{p.desc}</p>
                    </button>
                  )
                })}
              </div>
              {missingMeasures && (
                <p className="text-mapuche text-[11px] font-mono mt-2">
                  ⚠️ Completa peso y estatura en tu perfil para recalcular automáticamente.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">Objetivo diario</p>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded"
                      style={{ background: `${accent}18`, color: accent }}>
                  {GOAL_LABELS[currentGoal]?.desc}
                </span>
              </div>

              <div className="bg-[#1C2028] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-3xl text-white">{macros.calories.target}</p>
                    <p className="font-mono text-xs text-gray-500">kcal / día</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustCalories(-50)}
                      className="w-9 h-9 rounded-full font-display text-lg flex items-center justify-center"
                      style={{ background: '#2A2F3A', color: '#fff' }}>&minus;</button>
                    <span className="font-mono text-[10px] text-gray-500 w-8 text-center">&plusmn;50</span>
                    <button onClick={() => adjustCalories(50)}
                      className="w-9 h-9 rounded-full font-display text-lg flex items-center justify-center"
                      style={{ background: accent, color: '#111318' }}>+</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: 'Proteína', val: macros.protein.target, color: '#E23A2E' },
                    { label: 'Carbos',   val: macros.carbs.target,   color: '#6FD3E8' },
                    { label: 'Grasas',   val: macros.fat.target,     color: '#DE782C' },
                  ].map(m => (
                    <div key={m.label} className="text-center bg-[#16191F] rounded-xl py-2">
                      <p className="font-display text-lg" style={{ color: m.color }}>{m.val}g</p>
                      <p className="font-mono text-[10px] text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
                <p className="font-body text-[11px] text-gray-600 mt-3 leading-tight">
                  Los objetivos se recalculan según tu peso, estatura y actividad al cambiar de fase.
                  El ajuste &plusmn; es para afinar según lo que te indique tu nutricionista.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'entrenamiento' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">Tu semana</p>
              <span className="font-mono text-[11px]" style={{ color: accent }}>
                {trainingDays} días de entreno
              </span>
            </div>

            <div className="space-y-2">
              {weekPlan.map((d, i) => {
                const rest = d.focus === 'Descanso'
                const isEditing = editDay === i
                return (
                  <div key={d.day} className="bg-[#1C2028] rounded-xl overflow-hidden">
                    <button onClick={() => setEditDay(isEditing ? null : i)}
                      className="w-full flex items-center gap-3 px-3 py-3">
                      <span className="font-mono text-xs w-8" style={{ color: rest ? '#555' : accent }}>{d.day}</span>
                      <span className="text-base">{FOCUS_EMOJI[d.focus]}</span>
                      <span className={`flex-1 text-left font-body text-sm ${rest ? 'text-gray-500' : 'text-white'}`}>
                        {d.focus}
                      </span>
                      <span className="font-mono text-[10px] text-gray-600">{isEditing ? '▲' : 'editar'}</span>
                    </button>
                    {isEditing && (
                      <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
                        {FOCUS_OPTIONS.map(f => (
                          <button key={f} onClick={() => { setWeekDay(i, { focus: f }); setEditDay(null) }}
                            className="font-mono text-[10px] py-1.5 rounded-lg transition-colors"
                            style={{
                              background: d.focus === f ? accent : '#2A2F3A',
                              color: d.focus === f ? '#111318' : '#aaa',
                            }}>
                            {FOCUS_EMOJI[f]} {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="font-body text-[11px] text-gray-600 leading-tight">
              Toca cualquier día para cambiar el foco o marcarlo como descanso. Tu plan se guarda en tu cuenta.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
