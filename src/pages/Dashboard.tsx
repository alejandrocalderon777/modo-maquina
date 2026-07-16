import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { LINEAGES, LINEAGE_COACH_PHRASES } from '../assets/data'
import { MUSCLE_GROUPS, exercisesByMuscle, type MuscleGroup } from '../assets/exercises'
import { adjustWorkout, type AdjustedPlan } from '../lib/supabase'
import { CalorieRing, MacroRing } from '../components/MacroRing'
import type { Emotion } from '../types'

const EMOTION_CONFIG: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😔', label: 'Muy mal',       color: '#E23A2E' },
  2: { emoji: '😕', label: 'Bajo',          color: '#DE782C' },
  3: { emoji: '😐', label: 'Normal',        color: '#6FD3E8' },
  4: { emoji: '😊', label: 'Bien',          color: '#A8D420' },
  5: { emoji: '🔥', label: '¡Modo máquina!', color: '#CEFF3C' },
}

const WORKOUT_PLAN = [
  { name: 'Sentadilla',  sets: '4×10', weight: '80kg',     rest: '90seg' },
  { name: 'Press banca', sets: '3×8',  weight: '70kg',     rest: '90seg' },
  { name: 'Dominadas',   sets: '3×6',  weight: 'Corporal', rest: '60seg' },
  { name: 'Plancha',     sets: '3×45seg', weight: '—',     rest: '45seg' },
]

type Tab = 'home' | 'workout' | 'food' | 'progress' | 'avatar'

export default function Dashboard() {
  const navigate = useNavigate()
  const profile              = useAppStore((s) => s.profile)
  const measurements         = useAppStore((s) => s.measurements)
  const streakDays           = useAppStore((s) => s.streakDays)
  const xpPoints             = useAppStore((s) => s.xpPoints)
  const macros               = useAppStore((s) => s.macros)
  const foodLog              = useAppStore((s) => s.foodLog)
  const bodyPhotos           = useAppStore((s) => s.bodyPhotos)
  const workoutCompletions   = useAppStore((s) => s.workoutCompletions)
  const setEmotion           = useAppStore((s) => s.setEmotion)
  const addXP                = useAppStore((s) => s.addXP)
  const addWater             = useAppStore((s) => s.addWater)
  const toggleWorkout        = useAppStore((s) => s.toggleWorkout)
  const checkAndUpdateStreak = useAppStore((s) => s.checkAndUpdateStreak)

  const todayStr = new Date().toISOString().split('T')[0]

  // ── Streak: increment on first open of a new day
  useEffect(() => {
    // Ejecutar al montar
    checkAndUpdateStreak()

    // Ejecutar cuando la app vuelve a primer plano (clave para PWA)
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkAndUpdateStreak()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    // Timer cada 60s — detecta el cruce de medianoche sin reabrir la app
    const interval = setInterval(() => { checkAndUpdateStreak() }, 60_000)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      clearInterval(interval)
    }
  }, []) // eslint-disable-line

  const lineage     = LINEAGES.find((l) => l.id === profile.lineage)
  const accentColor = lineage?.color || '#CEFF3C'

  // Fix: map XP to the correct level name in the lineage array
  const xpLevel   = Math.floor(xpPoints / 500) + 1
  const xpProgress = (xpPoints % 500) / 500
  const levelIndex = Math.min(xpLevel - 1, (lineage?.levels.length || 1) - 1)
  const levelName  = lineage?.levels[levelIndex] || `Nivel ${xpLevel}`

  // Fix: emotion check-in resets daily
  const emotionIsToday = profile.emotionDate === todayStr
  const [emotion, setEmotionLocal] = useState<Emotion | null>(
    emotionIsToday ? (profile.emotionToday || null) : null
  )

  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [progressPeriod, setProgressPeriod] = useState<'day'|'week'|'month'|'year'>('week')
  const [openMuscle, setOpenMuscle] = useState<MuscleGroup | null>(null)
  const [adjusting, setAdjusting] = useState(false)
  const [adjustedPlan, setAdjustedPlan] = useState<AdjustedPlan | null>(null)
  const [adjustError, setAdjustError] = useState('')

  // Workout state from store (persists across renders)
  const todayDone = workoutCompletions[todayStr] || []
  const doneCount = WORKOUT_PLAN.filter(w => todayDone.includes(w.name)).length

  const coachPhrases = LINEAGE_COACH_PHRASES[profile.lineage || 'spartan'] || []
  const todayPhrase  = coachPhrases[new Date().getDay() % coachPhrases.length]
  const todayLog     = foodLog.filter(e => e.date === todayStr)

  // Fix: coach avatar uses the user's archetype
  const avatarSrc = `/avatar-${profile.archetype || 'warrior'}.png`

  const handleEmotion = (e: Emotion) => {
    setEmotionLocal(e)
    setEmotion(e)
    addXP(10)
  }

  const handleToggleWorkout = (name: string) => {
    const wasDone = todayDone.includes(name)
    toggleWorkout(todayStr, name)
    if (!wasDone) addXP(25)
  }

  const WEEK_DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const BASE_WEEK = [
    { day:'Lun', type:'Fuerza — Tren superior' },
    { day:'Mar', type:'Cardio — HIIT 30 min' },
    { day:'Mié', type:'Fuerza — Tren inferior' },
    { day:'Jue', type:'Descanso activo' },
    { day:'Vie', type:'Fuerza — Full body' },
    { day:'Sáb', type:'Cardio — Larga distancia' },
    { day:'Dom', type:'Descanso' },
  ]

  const handleAdjustWorkout = async () => {
    setAdjusting(true)
    setAdjustError('')
    setAdjustedPlan(null)
    try {
      // today index (0=Lun..6=Dom)
      const jsDay = new Date().getDay() // 0=Dom
      const todayIdx = jsDay === 0 ? 6 : jsDay - 1
      const currentPlan = BASE_WEEK.map((d, i) => ({
        ...d, done: i < todayIdx ? false : (i === todayIdx && doneCount === WORKOUT_PLAN.length),
      }))
      const missedDays = BASE_WEEK.filter((d, i) => i < todayIdx && !d.type.toLowerCase().includes('descanso')).map(d => `${d.day}: ${d.type}`)
      const remainingDays = WEEK_DAYS.slice(todayIdx)
      const goalMap: Record<string,string> = { lose_weight:'Bajar de peso', gain_muscle:'Ganar músculo', health:'Salud general' }
      const res = await adjustWorkout({
        currentPlan,
        missedDays,
        remainingDays,
        goal: profile.goal ? goalMap[profile.goal] : undefined,
        level: profile.level,
        daysPerWeek: profile.daysPerWeek,
      })
      setAdjustedPlan(res)
    } catch {
      setAdjustError('No se pudo recalcular. Intenta de nuevo.')
    } finally {
      setAdjusting(false)
    }
  }

  const handleTabClick = (id: Tab) => {
    if (id === 'food') { navigate('/food-log'); return }
    setActiveTab(id)
  }

  // ── Shared header ────────────────────────────────────────────
  const Header = (
    <div className="px-4 pt-12 pb-3 flex items-center justify-between">
      <div>
        <p className="font-mono text-xs text-gray-600 uppercase tracking-widest">
          {activeTab === 'home'     ? 'Buenos días' :
           activeTab === 'workout'  ? 'Entrenamiento' :
           activeTab === 'progress' ? 'Tu Progreso' : 'Tu Avatar'}
        </p>
        <h1 className="font-display font-black text-2xl text-white uppercase">
          {activeTab === 'home'     ? `${profile.name || 'Máquina'} 👊` :
           activeTab === 'workout'  ? 'Fuerza — Tren superior' :
           activeTab === 'progress' ? 'Evolución' :
           profile.archetype
             ? profile.archetype.charAt(0).toUpperCase() + profile.archetype.slice(1)
             : 'Avatar'}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-lg"
            style={{ background: `${accentColor}22`, color: accentColor }}>
            {streakDays}
          </div>
          <p className="font-mono text-xs text-gray-600 mt-0.5">racha</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center font-mono text-xs font-bold text-volt">
            {xpPoints}
          </div>
          <p className="font-mono text-xs text-gray-600 mt-0.5">XP</p>
        </div>
        <div className="rounded-xl overflow-hidden flex-shrink-0"
          style={{ width:52, height:52, border:`2px solid ${accentColor}`, boxShadow:`0 0 12px ${accentColor}44` }}>
          <img src={avatarSrc} alt="Coach" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  )

  // ── HOME tab ─────────────────────────────────────────────────
  const HomeContent = (
    <>
      {/* Lineage badge */}
      <div className="px-4 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background:`${accentColor}15`, color:accentColor, border:`1px solid ${accentColor}33` }}>
          <span>{lineage?.emblem}</span>
          <span className="uppercase tracking-widest">{lineage?.fullName} · {levelName}</span>
        </div>
      </div>

      {/* Emotion check-in — resets daily */}
      {!emotion ? (
        <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background:'#1C1F28', border:'1px solid #252933' }}>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Check-in · ¿Cómo llegaste hoy?</p>
          <div className="flex justify-between">
            {([1,2,3,4,5] as Emotion[]).map(e => (
              <button key={e} onClick={() => handleEmotion(e)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-800 transition-colors active:scale-95">
                <span className="text-2xl">{EMOTION_CONFIG[e].emoji}</span>
                <span className="text-xs font-mono text-gray-600">{EMOTION_CONFIG[e].label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-4 rounded-xl px-4 py-2.5 flex items-center gap-3"
          style={{ background:'#1C1F28', border:'1px solid #252933' }}>
          <span className="text-xl">{EMOTION_CONFIG[emotion].emoji}</span>
          <div className="flex-1">
            <p className="font-mono text-xs text-gray-500">Mood de hoy · +10 XP</p>
            <p className="text-white text-sm font-body">{EMOTION_CONFIG[emotion].label}</p>
          </div>
          <button onClick={() => setEmotionLocal(null)}
            className="text-gray-700 font-mono text-xs hover:text-gray-500">cambiar</button>
        </div>
      )}

      {/* Coach message */}
      <div className="mx-4 mb-4 rounded-2xl p-4"
        style={{ background:`linear-gradient(135deg, ${accentColor}12, ${accentColor}05)`, border:`1px solid ${accentColor}33` }}>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color:accentColor }}>
            Coach · {lineage?.fullName}
          </p>
          <p className="text-white text-sm font-body leading-relaxed italic">"{todayPhrase}"</p>
          {emotion && (
            <p className="text-gray-500 text-xs font-mono mt-1">
              {emotion <= 2 ? '— Hoy vamos suave, pero vamos.' : '— ¡A darle con todo!'}
            </p>
          )}
        </div>
      </div>

      {/* Macros preview */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Nutrición de hoy</p>
          <button onClick={() => navigate('/food-log')} className="font-mono text-xs px-3 py-1 rounded-lg"
            style={{ background:`${accentColor}20`, color:accentColor }}>
            + Registrar
          </button>
        </div>
        <div className="flex items-center justify-between">
          <CalorieRing consumed={macros.calories.consumed} target={macros.calories.target} size={90} />
          <div className="flex gap-3">
            <MacroRing label="Prot"   consumed={macros.protein.consumed} target={macros.protein.target} color="#E23A2E" size={56} />
            <MacroRing label="Carbs"  consumed={macros.carbs.consumed}   target={macros.carbs.target}   color="#6FD3E8" size={56} />
            <MacroRing label="Grasas" consumed={macros.fat.consumed}     target={macros.fat.target}     color="#DE782C" size={56} />
          </div>
        </div>

        {/* Water tracking with add buttons */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💧</span>
              <span className="font-mono text-xs text-gray-500">Agua</span>
            </div>
            <span className="font-mono text-xs" style={{ color:'#6FD3E8' }}>
              {macros.water.consumed}/{macros.water.target}ml
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${Math.min(100,(macros.water.consumed/macros.water.target)*100)}%`, background:'#6FD3E8' }} />
          </div>
          <div className="flex gap-2">
            {[200, 250, 500].map(ml => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex-1 py-1.5 rounded-lg font-mono text-xs transition-all active:scale-95"
                style={{ background:'#6FD3E818', color:'#6FD3E8', border:'1px solid #6FD3E830' }}>
                +{ml}ml
              </button>
            ))}
          </div>
        </div>

        {todayLog.length === 0 && (
          <p className="text-xs font-body text-gray-600 mt-3 italic">💡 Sin registros hoy — toca + para empezar.</p>
        )}
      </div>

      {/* Workout preview — misma estructura que bloque de nutrición */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Hoy toca</p>
          <button onClick={() => setActiveTab('workout')} className="font-mono text-xs px-3 py-1 rounded-lg"
            style={{ background:`${accentColor}20`, color:accentColor }}>
            Ver todo
          </button>
        </div>

        {/* Anillo grande + 3 ejercicios (espejo de CalorieRing + MacroRings) */}
        <div className="flex items-center justify-between">
          {/* Anillo de progreso de sesión */}
          {(() => {
            const size = 90
            const r = (size - 12) / 2
            const circ = 2 * Math.PI * r
            const offset = circ * (1 - doneCount / WORKOUT_PLAN.length)
            return (
              <div className="relative flex items-center justify-center" style={{ width:size, height:size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1C1F28" strokeWidth="10" />
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accentColor} strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                    className="progress-ring-circle" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono font-bold text-2xl" style={{ color:accentColor }}>{doneCount}</span>
                  <span className="font-mono text-xs text-gray-500">/{WORKOUT_PLAN.length}</span>
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">ejerc.</span>
                </div>
              </div>
            )
          })()}

          {/* 3 mini anillos de ejercicios (espejo de MacroRings) */}
          <div className="flex gap-3">
            {WORKOUT_PLAN.slice(0, 3).map(w => {
              const done = todayDone.includes(w.name)
              const col = done ? accentColor : '#3a3d47'
              const size = 56
              const r = (size - 8) / 2
              const circ = 2 * Math.PI * r
              return (
                <div key={w.name} className="flex flex-col items-center gap-1">
                  <div className="relative" style={{ width:size, height:size }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#252933" strokeWidth="6" />
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="6"
                        strokeLinecap="round" strokeDasharray={circ}
                        strokeDashoffset={done ? 0 : circ}
                        className="progress-ring-circle" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold" style={{ color:col }}>
                        {done ? '✓' : '·'}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-wider leading-tight">
                      {w.name.split(' ')[0].substring(0, 6)}
                    </p>
                    <p className="text-xs font-mono text-gray-600">{w.sets}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Barra de XP + botón (espejo de barra de agua) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span className="font-mono text-xs text-gray-500">XP sesión</span>
            </div>
            <span className="font-mono text-xs" style={{ color:accentColor }}>
              {doneCount * 25}/{WORKOUT_PLAN.length * 25} XP
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${(doneCount/WORKOUT_PLAN.length)*100}%`, background:accentColor }} />
          </div>
          <button onClick={() => setActiveTab('workout')}
            className="w-full py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-widest text-center transition-all active:scale-95"
            style={{ background: doneCount===WORKOUT_PLAN.length ? accentColor : `${accentColor}18`,
                     color: doneCount===WORKOUT_PLAN.length ? '#111318' : accentColor,
                     border:`1px solid ${accentColor}30` }}>
            {doneCount === WORKOUT_PLAN.length ? '✓ Sesión completada' : '▶ Iniciar entrenamiento'}
          </button>
        </div>

        {doneCount === 0 && (
          <p className="text-xs font-body text-gray-600 mt-3 italic">
            💡 Sin ejercicios hoy — toca Iniciar para comenzar.
          </p>
        )}
      </div>
    </>
  )

  // ── WORKOUT tab ──────────────────────────────────────────────
  const WorkoutContent = (
    <>
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden bg-gray-900">
        <div className="h-1.5 bg-gray-800">
          <div className="h-full transition-all duration-500"
            style={{ width:`${(doneCount/WORKOUT_PLAN.length)*100}%`, background:accentColor }} />
        </div>
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <p className="font-mono text-xs" style={{ color:accentColor }}>{doneCount}/{WORKOUT_PLAN.length} ejercicios</p>
          <p className="font-mono text-xs text-gray-500">+{doneCount * 25} XP ganados</p>
        </div>
        <div className="px-4 py-2 space-y-1">
          {WORKOUT_PLAN.map((w) => {
            const done = todayDone.includes(w.name)
            return (
              <button key={w.name} onClick={() => handleToggleWorkout(w.name)}
                className="w-full flex items-center gap-3 py-3 text-left rounded-xl px-2 transition-colors hover:bg-gray-800 active:scale-95">
                <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ borderColor:done ? accentColor : '#444', background:done ? accentColor : 'transparent' }}>
                  {done && <span className="text-carbon text-xs font-black">✓</span>}
                </div>
                <div className="flex-1">
                  <p className={`font-body text-base ${done ? 'line-through text-gray-600' : 'text-white'}`}>{w.name}</p>
                  <p className="font-mono text-xs text-gray-600 mt-0.5">{w.sets} · {w.weight} · descanso {w.rest}</p>
                </div>
                {!done && <span className="text-gray-700 text-sm">›</span>}
              </button>
            )
          })}
        </div>
        <div className="px-4 pb-4 pt-2">
          <button className="w-full py-4 rounded-2xl font-display font-black uppercase text-base tracking-widest transition-all active:scale-95"
            style={{ background:doneCount===WORKOUT_PLAN.length ? accentColor : `${accentColor}22`,
                     color:doneCount===WORKOUT_PLAN.length ? '#111318' : accentColor,
                     border:`1px solid ${accentColor}44` }}>
            {doneCount === WORKOUT_PLAN.length ? '🔥 SESIÓN COMPLETADA' : '▶ COMPLETAR SESIÓN'}
          </button>
          <button className="w-full py-2 text-xs font-mono text-gray-600 mt-1">No puedo hoy → Versión exprés 15 min</button>
        </div>
      </div>

      {/* Weekly plan */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Plan semanal</p>
          <button onClick={handleAdjustWorkout} disabled={adjusting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs active:scale-95 transition-transform"
            style={{ background:`${accentColor}18`, color:accentColor, border:`1px solid ${accentColor}44` }}>
            {adjusting ? (
              <><span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:accentColor, borderTopColor:'transparent'}}/> Recalculando…</>
            ) : '✨ Recalcular con IA'}
          </button>
        </div>

        <div className="space-y-2">
          {BASE_WEEK.map((d, i) => {
            const jsDay = new Date().getDay(); const todayIdx = jsDay === 0 ? 6 : jsDay - 1
            const isToday = i === todayIdx
            const done = isToday && doneCount === WORKOUT_PLAN.length
            return (
              <div key={d.day} className="flex items-center gap-3 py-1.5">
                <p className="font-mono text-xs w-8" style={{ color: isToday ? accentColor : '#555' }}>{d.day}</p>
                <p className={`flex-1 font-body text-sm ${done ? 'text-gray-600 line-through' : isToday ? 'text-white font-semibold' : 'text-white'}`}>{d.type}</p>
                {done && <span className="text-xs" style={{ color:accentColor }}>✓</span>}
                {isToday && !done && <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{background:`${accentColor}22`, color:accentColor, fontSize:'9px'}}>HOY</span>}
              </div>
            )
          })}
        </div>

        {adjustError && <p className="text-spartan text-xs font-mono mt-3">{adjustError}</p>}

        {/* AI adjusted plan result */}
        {adjustedPlan && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">✨</span>
              <p className="font-mono text-xs uppercase tracking-widest" style={{color:accentColor}}>Plan recalculado</p>
            </div>
            <p className="text-gray-400 text-xs font-body italic mb-3 leading-relaxed">"{adjustedPlan.resumen}"</p>
            <div className="space-y-1.5">
              {adjustedPlan.plan.map((p, i) => (
                <div key={i} className="rounded-lg px-3 py-2" style={{background:'#1C1F28'}}>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs w-8" style={{color:accentColor}}>{p.day}</p>
                    <p className="flex-1 text-white font-body text-sm">{p.type}</p>
                  </div>
                  {p.muscles && p.muscles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-10">
                      {p.muscles.map(m => (
                        <span key={m} className="font-mono px-1.5 py-0.5 rounded" style={{background:`${accentColor}18`, color:accentColor, fontSize:'9px'}}>{m}</span>
                      ))}
                    </div>
                  )}
                  {p.note && <p className="text-gray-600 text-xs font-mono mt-1 ml-10">{p.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exercise library by muscle group */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Biblioteca de ejercicios</p>
        <div className="space-y-2">
          {MUSCLE_GROUPS.map(mg => {
            const list = exercisesByMuscle(mg.id)
            const isOpen = openMuscle === mg.id
            return (
              <div key={mg.id} className="rounded-xl overflow-hidden" style={{background:'#1C1F28'}}>
                <button onClick={() => setOpenMuscle(isOpen ? null : mg.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:scale-98 transition-transform">
                  <span className="text-lg">{mg.emoji}</span>
                  <p className="flex-1 text-white font-display font-bold text-sm">{mg.id}</p>
                  <span className="font-mono text-xs text-gray-600">{list.length} ejercicios</span>
                  <svg style={{transform: isOpen?'rotate(90deg)':'rotate(0)'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-800">
                    {list.map(ex => (
                      <div key={ex.id} className="rounded-lg px-3 py-2" style={{background:'#252933'}}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-white font-body text-sm font-medium">{ex.name}</p>
                          <span className="font-mono text-xs" style={{color:accentColor}}>{ex.sets}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono px-1.5 py-0.5 rounded" style={{background:'#1C1F28', color:'#888', fontSize:'9px'}}>{ex.equipment === 'ninguno' ? 'sin equipo' : ex.equipment}</span>
                          <span className="font-mono px-1.5 py-0.5 rounded" style={{background:'#1C1F28', color:'#888', fontSize:'9px'}}>{ex.level}</span>
                        </div>
                        <p className="text-gray-500 text-xs font-body leading-relaxed">💡 {ex.tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  // ── PROGRESS tab ─────────────────────────────────────────────
  // helpers
  const getNDays = (n: number) => {
    const days: string[] = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }
  const dayLabel = (date: string) => {
    const d = new Date(date + 'T12:00:00')
    return d.toLocaleDateString('es-CL', { weekday:'short' }).slice(0,3)
  }
  const dayMonthLabel = (date: string) => {
    const d = new Date(date + 'T12:00:00')
    return d.toLocaleDateString('es-CL', { day:'numeric', month:'short' })
  }
  const dayCal  = (date: string) => foodLog.filter(e => e.date === date).reduce((s,e) => s + e.cal, 0)
  const dayProt = (date: string) => foodLog.filter(e => e.date === date).reduce((s,e) => s + e.prot, 0)
  const dayExDone = (date: string) => (workoutCompletions[date] || []).length
  const dayHasFood = (date: string) => foodLog.some(e => e.date === date)

  const last7  = getNDays(7)
  const last30 = getNDays(30)

  // yearly stats
  const allDates = Array.from(new Set(foodLog.map(e => e.date)))
  const allWodDates = Object.keys(workoutCompletions).filter(d => (workoutCompletions[d] || []).length > 0)
  const totalSessions = allWodDates.length
  const totalNutritionDays = allDates.length

  const maxCalWeek = Math.max(...last7.map(dayCal), macros.calories.target)
  const maxProtWeek = Math.max(...last7.map(dayProt), macros.protein.target)

  const ProgressContent = (
    <>
      {/* Period selector */}
      <div className="mx-4 mb-4 flex gap-2">
        {(['day','week','month','year'] as const).map(p => {
          const label = { day:'Día', week:'Semana', month:'Mes', year:'Año' }[p]
          return (
            <button key={p} onClick={() => setProgressPeriod(p)}
              className="flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all"
              style={{
                background: progressPeriod === p ? accentColor : '#1C1F28',
                color: progressPeriod === p ? '#111318' : '#666',
                border: `1px solid ${progressPeriod === p ? accentColor : '#252933'}`
              }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* ── helper: score combinado del día 0-100 ── */}
      {(() => { return null })()}

      {/* ── DÍA ── */}
      {progressPeriod === 'day' && (() => {
        const calPct   = Math.min(100, Math.round((macros.calories.consumed / macros.calories.target) * 100))
        const exPct    = WORKOUT_PLAN.length > 0 ? Math.round((doneCount / WORKOUT_PLAN.length) * 100) : 0
        const combined = Math.round((calPct + exPct) / 2)
        const scoreColor = combined >= 80 ? accentColor : combined >= 40 ? '#DE782C' : '#E23A2E'
        return (
          <>
            {/* Score combinado del día */}
            <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Cumplimiento · hoy</p>
                <span className="font-display font-black text-2xl" style={{ color:scoreColor }}>{combined}%</span>
              </div>
              {/* Dos barras principales: alimentación + ejercicio */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-mono text-xs text-gray-400">🍽️ Alimentación</p>
                    <p className="font-mono text-xs" style={{ color:accentColor }}>{calPct}%</p>
                  </div>
                  <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width:`${calPct}%`, background:accentColor }} />
                  </div>
                  <p className="font-mono text-xs text-gray-600 mt-1">{macros.calories.consumed}/{macros.calories.target} kcal</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-mono text-xs text-gray-400">🏋️ Ejercicio</p>
                    <p className="font-mono text-xs" style={{ color:'#6FD3E8' }}>{exPct}%</p>
                  </div>
                  <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width:`${exPct}%`, background:'#6FD3E8' }} />
                  </div>
                  <p className="font-mono text-xs text-gray-600 mt-1">{doneCount}/{WORKOUT_PLAN.length} ejercicios completados</p>
                </div>
              </div>
              {/* Detalle macros */}
              <div className="pt-3 border-t border-gray-800 space-y-2">
                {[
                  { l:'Proteína', v:macros.protein.consumed, t:macros.protein.target, u:'g', c:'#E23A2E' },
                  { l:'Carbos',   v:macros.carbs.consumed,   t:macros.carbs.target,   u:'g', c:'#6FD3E8' },
                  { l:'Grasas',   v:macros.fat.consumed,     t:macros.fat.target,     u:'g', c:'#DE782C' },
                  { l:'💧 Agua',  v:macros.water.consumed,   t:macros.water.target,   u:'ml',c:'#6FD3E8' },
                ].map(m => {
                  const p = Math.min(100, Math.round((m.v/m.t)*100))
                  return (
                    <div key={m.l} className="flex items-center gap-2">
                      <p className="font-mono text-xs text-gray-600 w-16 flex-shrink-0">{m.l}</p>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${p}%`, background:m.c }} />
                      </div>
                      <p className="font-mono text-xs w-16 text-right flex-shrink-0" style={{ color:m.c }}>{m.v}/{m.t}{m.u}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Lista de ejercicios */}
            <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Ejercicios · hoy</p>
              {WORKOUT_PLAN.map(w => {
                const done = todayDone.includes(w.name)
                return (
                  <div key={w.name} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                      style={{ borderColor:done ? '#6FD3E8' : '#333', background:done ? '#6FD3E8' : 'transparent' }}>
                      {done && <span className="text-carbon font-black" style={{ fontSize:'9px', color:'#111318' }}>✓</span>}
                    </div>
                    <p className={`flex-1 font-body text-sm ${done ? 'line-through text-gray-600' : 'text-white'}`}>{w.name}</p>
                    <p className="font-mono text-xs text-gray-600">{w.sets}</p>
                  </div>
                )
              })}
              <div className="mt-2 pt-2 flex justify-end">
                <p className="font-mono text-xs" style={{ color:accentColor }}>+{doneCount*25} XP ganados</p>
              </div>
            </div>
          </>
        )
      })()}

      {/* ── SEMANA ── */}
      {progressPeriod === 'week' && (() => {
        const weekFoodDays = last7.filter(d => dayHasFood(d)).length
        const weekExDays   = last7.filter(d => dayExDone(d) > 0).length
        const weekBothDays = last7.filter(d => dayHasFood(d) && dayExDone(d) > 0).length
        return (
          <>
            {/* Cumplimiento por día — alimentación + ejercicio juntos */}
            <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Cumplimiento · 7 días</p>
              {/* Encabezado columnas */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 flex-shrink-0" />
                <p className="font-mono text-center flex-1" style={{ fontSize:'8px', color:'#CEFF3C' }}>🍽 Aliment.</p>
                <p className="font-mono text-center flex-1" style={{ fontSize:'8px', color:'#6FD3E8' }}>🏋 Ejercicio</p>
                <div className="w-8 flex-shrink-0" />
              </div>
              <div className="space-y-2">
                {last7.map(date => {
                  const cal      = dayCal(date)
                  const calPct   = Math.min(100, macros.calories.target > 0 ? Math.round((cal / macros.calories.target) * 100) : 0)
                  const exCount  = dayExDone(date)
                  const exPct    = WORKOUT_PLAN.length > 0 ? Math.round((exCount / WORKOUT_PLAN.length) * 100) : 0
                  const combined = Math.round((calPct + exPct) / 2)
                  const isToday  = date === todayStr
                  const scoreColor = combined >= 80 ? accentColor : combined >= 40 ? '#DE782C' : combined === 0 ? '#333' : '#E23A2E'
                  return (
                    <div key={date} className="flex items-center gap-2">
                      <p className="font-mono text-xs w-8 flex-shrink-0" style={{ color: isToday ? '#6FD3E8' : '#555' }}>
                        {isToday ? 'Hoy' : dayLabel(date)}
                      </p>
                      {/* Barra alimentación */}
                      <div className="flex-1 h-4 rounded bg-gray-800 overflow-hidden">
                        {calPct > 0 && <div className="h-full rounded transition-all" style={{ width:`${calPct}%`, background: isToday ? '#CEFF3C88' : accentColor }} />}
                      </div>
                      {/* Barra ejercicio */}
                      <div className="flex-1 h-4 rounded bg-gray-800 overflow-hidden">
                        {exPct > 0 && <div className="h-full rounded transition-all" style={{ width:`${exPct}%`, background: isToday ? '#6FD3E888' : '#6FD3E8' }} />}
                      </div>
                      {/* Score combinado */}
                      <p className="font-mono text-xs w-8 text-right flex-shrink-0" style={{ color: scoreColor }}>
                        {combined === 0 ? '—' : `${combined}%`}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Resumen semanal */}
            <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
              {[
                { l:'Días completos', v:`${weekBothDays}`, u:'/7', c:accentColor },
                { l:'Días con comida', v:`${weekFoodDays}`, u:'/7', c:'#E23A2E' },
                { l:'Días con entreno', v:`${weekExDays}`, u:'/7', c:'#6FD3E8' },
                { l:'Consistencia', v:`${Math.round(weekBothDays/7*100)}`, u:'%', c:'#DE782C' },
              ].map(s => (
                <div key={s.l} className="rounded-xl p-3" style={{ background:'#1C1F28' }}>
                  <p className="font-display font-black text-2xl" style={{ color:s.c }}>
                    {s.v}<span className="text-sm font-mono text-gray-500">{s.u}</span>
                  </p>
                  <p className="font-mono text-xs text-gray-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </>
        )
      })()}

      {/* ── MES ── */}
      {progressPeriod === 'month' && (() => {
        const monthBoth  = last30.filter(d => dayHasFood(d) && dayExDone(d) > 0).length
        const monthFood  = last30.filter(d => dayHasFood(d)).length
        const monthEx    = last30.filter(d => dayExDone(d) > 0).length
        const adherencia = Math.round(monthBoth / 30 * 100)
        return (
          <>
            {/* Resumen rápido */}
            <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Cumplimiento · 30 días</p>
                <span className="font-display font-black text-xl" style={{ color: adherencia >= 60 ? accentColor : '#DE782C' }}>{adherencia}%</span>
              </div>
              {/* Dos barras: alimentación y ejercicio */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-xs text-gray-400">🍽️ Alimentación</p>
                    <p className="font-mono text-xs" style={{ color:accentColor }}>{monthFood}/30 días</p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.round(monthFood/30*100)}%`, background:accentColor }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-mono text-xs text-gray-400">🏋️ Ejercicio</p>
                    <p className="font-mono text-xs" style={{ color:'#6FD3E8' }}>{monthEx}/30 días</p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${Math.round(monthEx/30*100)}%`, background:'#6FD3E8' }} />
                  </div>
                </div>
              </div>
              {/* Heatmap */}
              <p className="font-mono text-xs text-gray-600 mb-2" style={{ fontSize:'9px' }}>ACTIVIDAD DIARIA</p>
              <div className="grid gap-1" style={{ gridTemplateColumns:'repeat(7, 1fr)' }}>
                {last30.map(date => {
                  const hasFood = dayHasFood(date)
                  const hasEx   = dayExDone(date) > 0
                  const isToday = date === todayStr
                  const bg = hasFood && hasEx ? accentColor
                    : hasEx   ? '#6FD3E8'
                    : hasFood ? `${accentColor}55`
                    : '#1C1F28'
                  return (
                    <div key={date} style={{ background:bg, aspectRatio:'1', borderRadius:'3px',
                      border: isToday ? `1px solid ${accentColor}` : '1px solid transparent' }} />
                  )
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {[
                  { c:accentColor,         l:'Ambos' },
                  { c:'#6FD3E8',           l:'Solo entreno' },
                  { c:`${accentColor}55`,  l:'Solo comida' },
                  { c:'#1C1F28',           l:'Descanso' },
                ].map(s => (
                  <div key={s.l} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ background:s.c, border:'1px solid #333' }} />
                    <p className="font-mono text-gray-600" style={{ fontSize:'8px' }}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
              {[
                { l:'Días con ambos', v:`${monthBoth}`, u:'/30', c:accentColor },
                { l:'Racha actual', v:`${streakDays}`, u:'d', c:'#DE782C' },
                { l:'Solo comida', v:`${monthFood - monthBoth}`, u:'d', c:'#E23A2E' },
                { l:'Solo entreno', v:`${monthEx - monthBoth}`, u:'d', c:'#6FD3E8' },
              ].map(s => (
                <div key={s.l} className="rounded-xl p-3" style={{ background:'#1C1F28' }}>
                  <p className="font-display font-black text-2xl" style={{ color:s.c }}>
                    {s.v}<span className="text-sm font-mono text-gray-500">{s.u}</span>
                  </p>
                  <p className="font-mono text-xs text-gray-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </>
        )
      })()}

      {/* ── AÑO ── */}
      {progressPeriod === 'year' && (() => {
        const daysSince = Math.max(1, Math.round(
          (Date.now() - new Date(foodLog.length > 0
            ? Math.min(...foodLog.map(e => new Date(e.date).getTime()))
            : Date.now()
          ).getTime()) / 86400000
        ))
        const wodPct  = Math.min(100, Math.round((allWodDates.length / daysSince) * 100))
        const foodPct = Math.min(100, Math.round((allDates.length / daysSince) * 100))
        const bothDays = allDates.filter(d => allWodDates.includes(d)).length
        const bothPct = Math.min(100, Math.round((bothDays / daysSince) * 100))
        return (
          <>
            <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">Adherencia · desde el inicio</p>
              <div className="flex justify-around mb-4">
                {[
                  { label:'Alimentación', pct:foodPct,  color:accentColor },
                  { label:'Ejercicio',    pct:wodPct,   color:'#6FD3E8' },
                  { label:'Ambos',        pct:bothPct,  color:'#DE782C' },
                ].map(({ label, pct, color }) => {
                  const size = 80; const r = (size-10)/2; const circ = 2*Math.PI*r
                  return (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className="relative" style={{ width:size, height:size }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1C1F28" strokeWidth="9" />
                          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="9"
                            strokeLinecap="round" strokeDasharray={circ}
                            strokeDashoffset={circ * (1 - pct/100)}
                            className="progress-ring-circle" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-mono font-bold text-lg" style={{ color }}>{pct}%</span>
                        </div>
                      </div>
                      <p className="font-mono text-xs text-gray-400 text-center">{label}</p>
                    </div>
                  )
                })}
              </div>
              {/* Barras de cumplimiento acumulado */}
              <div className="pt-3 border-t border-gray-800 space-y-2">
                {[
                  { l:'🍽️ Días con comida registrada', v:allDates.length, t:daysSince, c:accentColor },
                  { l:'🏋️ Días con entreno', v:allWodDates.length, t:daysSince, c:'#6FD3E8' },
                  { l:'✅ Días con ambos cumplidos', v:bothDays, t:daysSince, c:'#DE782C' },
                ].map(m => (
                  <div key={m.l}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-mono text-gray-500" style={{ fontSize:'9px' }}>{m.l}</p>
                      <p className="font-mono text-xs" style={{ color:m.c }}>{m.v}/{m.t}d</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${Math.round(m.v/m.t*100)}%`, background:m.c }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
              {[
                { l:'Sesiones totales', v:`${totalSessions}`, c:'#6FD3E8' },
                { l:'Días con registro', v:`${totalNutritionDays}`, c:accentColor },
                { l:'Racha actual', v:`${streakDays}d`, c:'#DE782C' },
                { l:'XP acumulados', v:`${xpPoints}`, c:'#E23A2E' },
              ].map(s => (
                <div key={s.l} className="rounded-xl p-3" style={{ background:'#1C1F28' }}>
                  <p className="font-display font-black text-2xl" style={{ color:s.c }}>{s.v}</p>
                  <p className="font-mono text-xs text-gray-500 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </>
        )
      })()}

      {/* Medidas — siempre visible */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Medidas corporales</p>
        {measurements.weight ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { l:'Peso',     v: measurements.weight,  u:'kg' },
              { l:'Estatura', v: measurements.height,  u:'cm' },
              { l:'IMC', v: measurements.weight && measurements.height
                  ? +((measurements.weight / ((measurements.height/100)**2)).toFixed(1)) : null, u:'' },
              { l:'Cintura',  v: measurements.waist,   u:'cm' },
              { l:'Pecho',    v: measurements.chest,   u:'cm' },
              { l:'Cadera',   v: measurements.hips,    u:'cm' },
              { l:'Bíceps',   v: measurements.bicep,   u:'cm' },
              { l:'Muslo',    v: measurements.thigh,   u:'cm' },
            ].filter(m => m.v).map(m => (
              <div key={m.l} className="rounded-xl p-3" style={{ background:'#1C1F28' }}>
                <p className="font-display font-black text-xl" style={{ color:accentColor }}>
                  {m.v} <span className="text-sm font-mono text-gray-500">{m.u}</span>
                </p>
                <p className="font-mono text-xs text-gray-500 mt-0.5">{m.l}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm font-body">Sin medidas registradas</p>
            <p className="text-gray-700 text-xs font-mono mt-1">Completa tu perfil para ver tu progreso</p>
          </div>
        )}
      </div>

      {/* Fotos — siempre visible */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Fotos corporales</p>
        {bodyPhotos.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-2">📸</p>
            <p className="text-gray-500 text-sm font-body">Sin fotos de progreso</p>
            <p className="text-gray-700 text-xs font-mono mt-1">Las fotos se toman en el paso de medidas</p>
          </div>
        ) : bodyPhotos.length >= 2 ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[bodyPhotos[bodyPhotos.length - 1], bodyPhotos[0]].map((p, i) => (
                <div key={p.id} className="relative rounded-xl overflow-hidden aspect-[3/4]"
                  style={{ border: i === 1 ? `1.5px solid ${accentColor}` : '1.5px solid #252933' }}>
                  <img src={p.dataUrl} alt="Progreso" className="w-full h-full object-cover object-top" />
                  <div className="absolute bottom-0 inset-x-0 px-2 py-2" style={{ background:'rgba(0,0,0,0.6)' }}>
                    <p className="text-white font-mono text-xs">
                      {new Date(p.date).toLocaleDateString('es-CL', { day:'2-digit', month:'short' })}
                    </p>
                    <p className="font-mono text-xs" style={{ color: i === 1 ? accentColor : '#888' }}>
                      {i === 0 ? 'Inicio' : 'Hoy'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {bodyPhotos.length > 2 && (
              <div className="grid grid-cols-3 gap-2">
                {bodyPhotos.slice(1, bodyPhotos.length - 1).slice(-3).map(p => (
                  <div key={p.id} className="relative rounded-lg overflow-hidden aspect-square">
                    <img src={p.dataUrl} alt="Progreso" className="w-full h-full object-cover object-top" />
                    <div className="absolute bottom-0 inset-x-0 px-1 py-1" style={{ background:'rgba(0,0,0,0.5)' }}>
                      <p className="text-white font-mono" style={{ fontSize:'8px' }}>
                        {new Date(p.date).toLocaleDateString('es-CL', { day:'2-digit', month:'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {bodyPhotos.map((p, i) => (
              <div key={p.id} className="relative rounded-xl overflow-hidden aspect-[3/4]">
                <img src={p.dataUrl} alt="Progreso" className="w-full h-full object-cover object-top" />
                <div className="absolute bottom-0 inset-x-0 px-2 py-2" style={{ background:'rgba(0,0,0,0.6)' }}>
                  <p className="text-white font-mono text-xs">
                    {new Date(p.date).toLocaleDateString('es-CL', { day:'2-digit', month:'short' })}
                  </p>
                  {i === 0 && <p className="font-mono text-xs" style={{ color:accentColor }}>Más reciente</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )

  // ── AVATAR tab ───────────────────────────────────────────────
  const ARCHETYPE_META: Record<string, { desc: string; traits: string[] }> = {
    runner:  { desc:'Nacido para correr. Resistencia infinita, mente de acero.',        traits:['Resistencia','VO2 Max','Mentalidad'] },
    builder: { desc:'La fuerza es tu herramienta. Construyes tu cuerpo ladrillo a ladrillo.', traits:['Fuerza','Hipertrofia','Disciplina'] },
    fitness: { desc:'El equilibrio perfecto entre estética y rendimiento.',               traits:['Tonificación','Flexibilidad','Energía'] },
    warrior: { desc:'Guerrero total. Combina fuerza, resistencia y ferocidad.',           traits:['Explosividad','Agilidad','Carácter'] },
  }
  const archMeta = ARCHETYPE_META[profile.archetype || 'warrior']

  const AvatarContent = (
    <>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden relative"
        style={{ background:`linear-gradient(160deg, ${accentColor}20, #1C1F28)`, border:`1px solid ${accentColor}30` }}>
        <div className="flex gap-4 p-4">
          <div className="rounded-2xl overflow-hidden flex-shrink-0"
            style={{ width:96, height:96, border:`2px solid ${accentColor}` }}>
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color:accentColor }}>Arquetipo</p>
            <p className="font-display font-black text-2xl text-white uppercase">{profile.archetype || 'Warrior'}</p>
            <p className="text-gray-400 text-xs font-body mt-1 leading-relaxed">{archMeta?.desc}</p>
          </div>
        </div>
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {archMeta?.traits.map(t => (
            <span key={t} className="px-3 py-1 rounded-full font-mono text-xs"
              style={{ background:`${accentColor}15`, color:accentColor, border:`1px solid ${accentColor}30` }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Nivel {xpLevel}</p>
            <p className="font-display font-black text-xl text-white">{levelName}</p>
          </div>
          <p className="font-display font-black text-3xl" style={{ color:accentColor }}>
            {xpPoints} <span className="text-sm font-mono text-gray-500">XP</span>
          </p>
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width:`${xpProgress * 100}%`, background:accentColor }} />
        </div>
        <p className="font-mono text-xs text-gray-600 mt-1">
          {Math.round((1 - xpProgress) * 500)} XP para nivel {xpLevel + 1} — {lineage?.levels[levelIndex + 1] || 'Máximo nivel'}
        </p>
      </div>

      <div className="mx-4 mb-4 rounded-2xl p-4 bg-gray-900">
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Linaje</p>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border:`2px solid ${accentColor}50` }}>
            <img src={`/linaje-${profile.lineage || 'spartan'}.png`} alt={lineage?.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white font-display font-bold text-lg">{lineage?.fullName}</p>
            <p className="text-gray-500 text-xs font-mono">{lineage?.coachStyle}</p>
          </div>
        </div>
      </div>

      <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
        {[
          { l:'Racha',  v:`${streakDays}d`,    c:accentColor },
          { l:'Comidas', v:`${foodLog.length}`, c:'#E23A2E' },
          { l:'Fotos',   v:`${bodyPhotos.length}`, c:'#6FD3E8' },
        ].map(s => (
          <div key={s.l} className="rounded-2xl p-4 text-center bg-gray-900">
            <p className="font-display font-black text-2xl" style={{ color:s.c }}>{s.v}</p>
            <p className="font-mono text-xs text-gray-500 mt-1">{s.l}</p>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-carbon flex flex-col pb-24">
      {Header}

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'home'     && HomeContent}
        {activeTab === 'workout'  && WorkoutContent}
        {activeTab === 'progress' && ProgressContent}
        {activeTab === 'avatar'   && AvatarContent}
      </div>


      {/* FAB — Registrar comida */}
      <button onClick={() => navigate('/food-log')}
        className="fixed z-50 flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
        style={{ bottom:'88px', right:'20px', width:'60px', height:'60px', borderRadius:'18px',
          background:'linear-gradient(135deg, #CEFF3C 0%, #a8d400 100%)',
          boxShadow:'0 4px 24px rgba(206,255,60,0.45)' }}
        aria-label="Registrar comida">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111318"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
        </svg>
        <span className="absolute flex items-center justify-center font-black"
          style={{ top:'-6px', right:'-6px', width:'20px', height:'20px', borderRadius:'50%',
            background:'#E23A2E', color:'#fff', fontSize:'14px', lineHeight:1 }}>+</span>
      </button>

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around py-3"
        style={{ background:'rgba(17,19,24,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid #1C1F28' }}>
        {([
          { id:'home',     icon:'🏠', label:'Inicio' },
          { id:'workout',  icon:'🏋️', label:'Entrena' },
          { id:'food',     icon:'🍽️', label:'Comida' },
          { id:'progress', icon:'📊', label:'Progreso' },
          { id:'avatar',   icon:'⚡', label:'Avatar' },
        ] as { id:Tab; icon:string; label:string }[]).map(tab => (
          <button key={tab.id} onClick={() => handleTabClick(tab.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={{ color: activeTab === tab.id ? accentColor : '#555' }}>
            <span className="text-xl">{tab.icon}</span>
            <span className="font-mono text-xs">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="w-1 h-1 rounded-full" style={{ background:accentColor }} />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
