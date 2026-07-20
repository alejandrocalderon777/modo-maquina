import { useEffect, useState } from 'react'
import { getAchievement, TIER_COLORS } from '../assets/achievements'

interface Props {
  ids: string[]
  onDismiss: () => void
}

export function AchievementToast({ ids, onDismiss }: Props) {
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => { setIdx(0); setShow(ids.length > 0) }, [ids])

  if (!show || ids.length === 0) return null
  const a = getAchievement(ids[idx])
  if (!a) return null

  const next = () => {
    if (idx + 1 < ids.length) setIdx(idx + 1)
    else { setShow(false); onDismiss() }
  }

  const color = TIER_COLORS[a.tier]

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6" style={{ zIndex: 70, background:'rgba(0,0,0,0.8)' }}
      onClick={next}>
      <div className="w-full max-w-sm rounded-3xl p-6 text-center relative overflow-hidden"
        style={{ background:'#1C1F28', border:`2px solid ${color}`, boxShadow:`0 0 40px ${color}44`,
                 animation:'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>

        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background:`radial-gradient(circle at 50% 0%, ${color}33, transparent 70%)` }} />

        <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color }}>
          ¡Logro desbloqueado!
        </p>

        <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-3"
          style={{ background:`${color}18`, border:`2px solid ${color}66` }}>
          <span style={{ fontSize:44 }}>{a.emoji}</span>
        </div>

        <p className="font-display font-black text-2xl text-white uppercase leading-tight">{a.name}</p>
        <p className="text-gray-400 text-sm font-body mt-1 leading-relaxed">{a.desc}</p>

        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="font-mono px-2 py-1 rounded uppercase" style={{ background:`${color}22`, color, fontSize:'10px' }}>
            {a.tier}
          </span>
          <span className="font-mono px-2 py-1 rounded" style={{ background:'#CEFF3C22', color:'#CEFF3C', fontSize:'10px' }}>
            +{a.xp} XP
          </span>
        </div>

        <button onClick={next}
          className="w-full mt-5 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm"
          style={{ background: color, color:'#111318' }}>
          {idx + 1 < ids.length ? `Siguiente (${idx + 1}/${ids.length})` : 'Seguir'}
        </button>
      </div>
    </div>
  )
}
