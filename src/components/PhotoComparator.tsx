import { useState } from 'react'
import type { BodyPhoto } from '../types'

interface Props {
  photos: BodyPhoto[]   // newest first
  accentColor: string
  onClose: () => void
}

const fmt = (d: string) => new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })

export function PhotoComparator({ photos, accentColor, onClose }: Props) {
  // default: oldest (A) vs newest (B)
  const ordered = [...photos].sort((a, b) => a.date.localeCompare(b.date))
  const [aId, setAId] = useState(ordered[0]?.id)
  const [bId, setBId] = useState(ordered[ordered.length - 1]?.id)
  const [mode, setMode] = useState<'side' | 'slider'>('side')
  const [slider, setSlider] = useState(50)

  const A = photos.find(p => p.id === aId) || ordered[0]
  const B = photos.find(p => p.id === bId) || ordered[ordered.length - 1]

  const daysBetween = A && B
    ? Math.abs(Math.round((new Date(B.date).getTime() - new Date(A.date).getTime()) / 86400000))
    : 0

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 65, background:'#111318' }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
        <button onClick={onClose} className="text-gray-500 font-mono text-sm">← Cerrar</button>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Comparar progreso</p>
        <div className="w-12" />
      </div>

      {/* Mode toggle */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 p-1 rounded-xl" style={{ background:'#1C1F28' }}>
          {([['side','Lado a lado'],['slider','Deslizador']] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all"
              style={{ background: mode === m ? accentColor : 'transparent', color: mode === m ? '#111318' : '#666' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {daysBetween > 0 && (
          <p className="text-center font-mono text-xs mb-3" style={{ color:accentColor }}>
            {daysBetween} días de diferencia
          </p>
        )}

        {mode === 'side' ? (
          <div className="grid grid-cols-2 gap-2">
            {[{ p:A, label:'Antes' }, { p:B, label:'Después' }].map(({ p, label }, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-[3/4]"
                style={{ border: i === 1 ? `2px solid ${accentColor}` : '2px solid #252933' }}>
                {p && <img src={p.dataUrl} alt={label} className="w-full h-full object-cover object-top" />}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded font-mono"
                  style={{ background:'rgba(0,0,0,0.7)', color: i === 1 ? accentColor : '#fff', fontSize:'10px' }}>
                  {label}
                </div>
                <div className="absolute bottom-0 inset-x-0 px-2 py-1.5" style={{ background:'rgba(0,0,0,0.65)' }}>
                  <p className="text-white font-mono text-xs">{p && fmt(p.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden aspect-[3/4] mx-auto" style={{ maxWidth:340 }}>
            {B && <img src={B.dataUrl} alt="Después" className="absolute inset-0 w-full h-full object-cover object-top" />}
            {A && (
              <div className="absolute inset-0 overflow-hidden" style={{ width:`${slider}%` }}>
                <img src={A.dataUrl} alt="Antes"
                  className="h-full object-cover object-top"
                  style={{ width: '340px', maxWidth:'none' }} />
              </div>
            )}
            {/* Divider line */}
            <div className="absolute inset-y-0 pointer-events-none" style={{ left:`${slider}%`, width:2, background:accentColor, boxShadow:`0 0 8px ${accentColor}` }} />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded font-mono" style={{ background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:'10px' }}>Antes</div>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded font-mono" style={{ background:'rgba(0,0,0,0.7)', color:accentColor, fontSize:'10px' }}>Después</div>
          </div>
        )}

        {mode === 'slider' && (
          <input type="range" min={0} max={100} value={slider} onChange={e => setSlider(Number(e.target.value))}
            className="w-full mt-4" style={{ accentColor }} />
        )}

        {/* Date selectors */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1.5">Antes</p>
            <select value={aId} onChange={e => setAId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-volt">
              {ordered.map(p => <option key={p.id} value={p.id}>{fmt(p.date)}</option>)}
            </select>
          </div>
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1.5">Después</p>
            <select value={bId} onChange={e => setBId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-volt">
              {ordered.map(p => <option key={p.id} value={p.id}>{fmt(p.date)}</option>)}
            </select>
          </div>
        </div>

        <p className="text-gray-700 text-xs font-mono text-center mt-4">
          Tus fotos son privadas. Nunca se comparten.
        </p>
      </div>
    </div>
  )
}
