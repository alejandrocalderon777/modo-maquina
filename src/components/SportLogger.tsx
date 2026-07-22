import { useState } from 'react'
import { SPORTS, estimateCalories, type Sport } from '../assets/sports'

interface Props {
  accentColor: string
  weightKg?: number
  onClose: () => void
  onSave: (data: { sport: Sport; minutes: number; cal: number }) => void
}

const DURATIONS = [30, 45, 60, 90, 120]

export function SportLogger({ accentColor, weightKg, onClose, onSave }: Props) {
  const [sport, setSport] = useState<Sport | null>(null)
  const [minutes, setMinutes] = useState(60)

  const cal = sport ? estimateCalories(sport.met, weightKg || 75, minutes) : 0

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 65, background:'#111318' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
        <button onClick={onClose} className="text-gray-500 font-mono text-sm">← Cancelar</button>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Registrar deporte</p>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!sport ? (
          <>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">¿Qué hiciste?</p>
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map(s => (
                <button key={s.id} onClick={() => setSport(s)}
                  className="flex flex-col items-center gap-1.5 py-4 rounded-2xl active:scale-95 transition-transform"
                  style={{ background:'#1C1F28', border:'1px solid #252933' }}>
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="font-mono text-white text-center leading-tight" style={{ fontSize:'10px' }}>{s.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setSport(null)} className="font-mono text-xs text-gray-600 mb-4">← cambiar deporte</button>
            <div className="flex flex-col items-center mb-6">
              <span className="text-5xl mb-2">{sport.emoji}</span>
              <p className="font-display font-black text-2xl text-white uppercase">{sport.name}</p>
              <span className="font-mono px-2 py-0.5 rounded mt-1" style={{ background:`${accentColor}22`, color:accentColor, fontSize:'10px' }}>{sport.type}</span>
            </div>

            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Duración</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setMinutes(d)}
                  className="py-3 rounded-xl font-mono text-sm"
                  style={{ background: minutes === d ? accentColor : '#1C1F28', color: minutes === d ? '#111318' : '#888' }}>
                  {d}<span className="text-xs">m</span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl p-4 mb-6 text-center" style={{ background:'#1C1F28' }}>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Calorías estimadas</p>
              <p className="font-display font-black text-4xl" style={{ color:accentColor }}>{cal}</p>
              <p className="font-mono text-xs text-gray-600 mt-1">
                {sport.type === 'cardio' ? '✓ Cubriste tu cardio de hoy' : sport.type === 'fuerza' ? '✓ Trabajaste fuerza hoy' : '✓ Entrenamiento completo'}
              </p>
            </div>

            <button onClick={() => onSave({ sport, minutes, cal })}
              className="w-full py-4 rounded-2xl font-display font-black uppercase tracking-widest text-base active:scale-95 transition-transform"
              style={{ background:accentColor, color:'#111318' }}>
              Registrar y mantener racha
            </button>
          </>
        )}
      </div>
    </div>
  )
}
