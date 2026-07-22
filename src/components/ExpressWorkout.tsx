import { useEffect, useRef, useState } from 'react'
import { EXERCISES } from '../assets/exercises'

interface Props {
  accentColor: string
  onClose: () => void
  onComplete: () => void
}

interface Block { name: string; seconds: number; rest: number; tip: string; round: number }

// Build a ~15 min bodyweight circuit: 2 rounds of 7 no-equipment exercises
function buildCircuit(): Block[] {
  const pool = EXERCISES.filter(e => e.equipment === 'ninguno')
  const pick = (muscle: string) => pool.filter(e => e.muscle === muscle)
  const order = ['Cardio', 'Piernas', 'Pecho', 'Core', 'Glúteos', 'Cardio', 'Core']
  const base: Block[] = []
  const used = new Set<string>()
  for (const m of order) {
    const cands = pick(m).filter(e => !used.has(e.id))
    const ex = (cands[0] || pick(m)[0])
    if (!ex) continue
    used.add(ex.id)
    base.push({ name: ex.name, seconds: 45, rest: 15, tip: ex.tip, round: 1 })
  }
  // 2 rounds → ~15 min
  const round2 = base.map(b => ({ ...b, round: 2 }))
  return [...base, ...round2]
}

export function ExpressWorkout({ accentColor, onClose, onComplete }: Props) {
  const [circuit] = useState<Block[]>(buildCircuit)
  const [phase, setPhase] = useState<'intro' | 'work' | 'rest' | 'done'>('intro')
  const [idx, setIdx] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalMin = Math.round(circuit.reduce((s, b) => s + b.seconds + b.rest, 0) / 60)

  useEffect(() => {
    if (phase === 'intro' || phase === 'done' || paused) return
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { advance(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, paused, idx])

  const start = () => { setIdx(0); setPhase('work'); setRemaining(circuit[0].seconds) }

  const advance = () => {
    if (phase === 'work') {
      if (circuit[idx].rest > 0 && idx < circuit.length) {
        setPhase('rest'); setRemaining(circuit[idx].rest)
      } else nextExercise()
    } else if (phase === 'rest') {
      nextExercise()
    }
  }
  const nextExercise = () => {
    if (idx + 1 >= circuit.length) { setPhase('done') }
    else { setIdx(i => i + 1); setPhase('work'); setRemaining(circuit[idx + 1].seconds) }
  }

  const cur = circuit[idx]
  const progress = (idx + (phase === 'rest' ? 0.5 : 0)) / circuit.length

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 65, background:'#111318' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
        <button onClick={onClose} className="text-gray-500 font-mono text-sm">← Salir</button>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Exprés · {totalMin} min</p>
        <div className="w-12" />
      </div>

      {phase === 'intro' && (
        <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
          <p className="text-5xl mb-3">⚡</p>
          <h2 className="font-display font-black text-3xl text-white uppercase leading-tight mb-2">
            Sin excusas
          </h2>
          <p className="text-gray-400 text-sm font-body leading-relaxed mb-5">
            Rutina exprés de {totalMin} minutos, sin equipo. Mantener la racha vale más que la sesión perfecta.
            {circuit.length} ejercicios, 40s de trabajo y 20s de descanso.
          </p>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">2 rondas · el circuito</p>
          <div className="space-y-2 mb-6">
            {circuit.slice(0, circuit.length/2).map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background:'#1C1F28' }}>
                <span className="font-mono text-xs w-5" style={{ color:accentColor }}>{i + 1}</span>
                <p className="flex-1 text-white font-body text-sm">{b.name}</p>
                <span className="font-mono text-xs text-gray-600">{b.seconds}s</span>
              </div>
            ))}
          </div>
          <button onClick={start}
            className="w-full py-4 rounded-2xl font-display font-black uppercase tracking-widest text-base active:scale-95 transition-transform"
            style={{ background:accentColor, color:'#111318' }}>
            ▶ Empezar
          </button>
        </div>
      )}

      {(phase === 'work' || phase === 'rest') && cur && (
        <div className="flex-1 flex flex-col items-center justify-center px-6"
          style={{ background: phase === 'rest' ? '#1C1F28' : '#111318' }}>
          <div className="h-1.5 w-full max-w-sm rounded-full bg-gray-800 overflow-hidden mb-8">
            <div className="h-full rounded-full transition-all" style={{ width:`${progress*100}%`, background:accentColor }} />
          </div>

          <p className="font-mono text-xs uppercase tracking-widest mb-2"
            style={{ color: phase === 'rest' ? '#6FD3E8' : accentColor }}>
            {phase === 'rest' ? 'Descanso' : `Ronda ${cur.round}/2 · ${(idx % (circuit.length/2)) + 1}/${circuit.length/2}`}
          </p>

          <p className="font-display font-black text-3xl text-white uppercase text-center leading-tight mb-1">
            {phase === 'rest' ? (circuit[idx + 1]?.name || '¡Casi!') : cur.name}
          </p>
          {phase === 'rest' && <p className="font-mono text-xs text-gray-500 mb-4">viene ahora</p>}
          {phase === 'work' && <p className="text-gray-500 text-xs font-body text-center mb-4 max-w-xs">💡 {cur.tip}</p>}

          <p className="font-display font-black tabular-nums" style={{ fontSize:96, color: phase === 'rest' ? '#6FD3E8' : accentColor, lineHeight:1 }}>
            {remaining}
          </p>

          <div className="flex gap-3 mt-8">
            <button onClick={() => setPaused(p => !p)}
              className="px-6 py-3 rounded-xl font-mono text-sm" style={{ background:'#1C1F28', color:'#888' }}>
              {paused ? '▶ Seguir' : '⏸ Pausa'}
            </button>
            <button onClick={advance}
              className="px-6 py-3 rounded-xl font-mono text-sm" style={{ background:'#1C1F28', color:accentColor }}>
              Saltar →
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-6xl mb-4">🔥</p>
          <h2 className="font-display font-black text-3xl text-white uppercase leading-tight mb-2">
            ¡Sesión exprés lista!
          </h2>
          <p className="text-gray-400 text-sm font-body leading-relaxed mb-8">
            {totalMin} minutos que mantienen tu racha viva. Esto es modo máquina de verdad: aparecer incluso los días difíciles.
          </p>
          <button onClick={onComplete}
            className="w-full py-4 rounded-2xl font-display font-black uppercase tracking-widest text-base active:scale-95 transition-transform"
            style={{ background:accentColor, color:'#111318' }}>
            Reclamar +100 XP
          </button>
        </div>
      )}
    </div>
  )
}
