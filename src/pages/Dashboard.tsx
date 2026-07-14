import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { LINEAGES, LINEAGE_COACH_PHRASES } from '../assets/data'
import AvatarDisplay from '../components/AvatarDisplay'
import { CalorieRing, MacroRing } from '../components/MacroRing'
import type { Emotion, Lineage, Archetype } from '../types'

const EMOTION_CONFIG: Record<Emotion, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😔', label: 'Muy mal', color: '#E23A2E' },
  2: { emoji: '😕', label: 'Bajo', color: '#DE782C' },
  3: { emoji: '😐', label: 'Normal', color: '#6FD3E8' },
  4: { emoji: '😊', label: 'Bien', color: '#A8D420' },
  5: { emoji: '🔥', label: '¡Modo máquina!', color: '#CEFF3C' },
}

const WORKOUTS_TODAY = [
  { name: 'Sentadilla', sets: '4×10', weight: '80kg', done: false },
  { name: 'Press banca', sets: '3×8', weight: '70kg', done: false },
  { name: 'Dominadas', sets: '3×6', weight: 'Corporal', done: false },
  { name: 'Plancha', sets: '3×45seg', weight: '—', done: false },
]

export default function Dashboard() {
  const profile = useAppStore((s) => s.profile)
  const measurements = useAppStore((s) => s.measurements)
  const streakDays = useAppStore((s) => s.streakDays)
  const xpPoints = useAppStore((s) => s.xpPoints)
  const macros = useAppStore((s) => s.macros)
  const setEmotion = useAppStore((s) => s.setEmotion)
  const addXP = useAppStore((s) => s.addXP)

  const lineage = LINEAGES.find((l) => l.id === profile.lineage)
  const accentColor = lineage?.color || '#CEFF3C'
  const levelName = lineage?.levels[0] || 'Nivel 1'

  const [emotion, setEmotionLocal] = useState<Emotion | null>(profile.emotionToday || null)
  const [workouts, setWorkouts] = useState(WORKOUTS_TODAY)
  const [activeTab, setActiveTab] = useState<'home' | 'workout' | 'food' | 'progress' | 'avatar'>('home')

  const coachPhrases = LINEAGE_COACH_PHRASES[profile.lineage || 'spartan'] || []
  const todayPhrase = coachPhrases[new Date().getDay() % coachPhrases.length]

  const handleEmotion = (e: Emotion) => {
    setEmotionLocal(e)
    setEmotion(e)
    addXP(10)
  }

  const toggleWorkout = (i: number) => {
    setWorkouts((prev) =>
      prev.map((w, idx) => {
        if (idx !== i) return w
        if (!w.done) addXP(25)
        return { ...w, done: !w.done }
      })
    )
  }

  const doneCount = workouts.filter((w) => w.done).length

  return (
    <div className="min-h-screen bg-carbon flex flex-col pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-gray-600 uppercase tracking-widest">Buenos días</p>
          <h1 className="font-display font-black text-2xl text-white uppercase">
            {profile.name || 'Máquina'} 👊
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-lg"
              style={{ background: `${accentColor}22`, color: accentColor }}
            >
              {streakDays}
            </div>
            <p className="font-mono text-xs text-gray-600 mt-0.5">racha</p>
          </div>
          {/* XP */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-carbon-light flex items-center justify-center font-mono text-xs font-bold text-volt">
              {xpPoints}
            </div>
            <p className="font-mono text-xs text-gray-600 mt-0.5">XP</p>
          </div>
          {/* Avatar mini */}
          <AvatarDisplay
            archetype="warrior"
            lineage={(profile.lineage as Lineage) || 'spartan'}
            size="sm"
          />
        </div>
      </div>

      {/* Lineage badge */}
      <div className="px-4 mb-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}33` }}
        >
          <span>{lineage?.emblem}</span>
          <span className="uppercase tracking-widest">{lineage?.fullName} · {levelName}</span>
        </div>
      </div>

      {/* Emotion check-in */}
      {!emotion && (
        <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background: '#1C1F28', border: '1px solid #252933' }}>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">
            Check-in diario · ¿Cómo llegaste hoy?
          </p>
          <div className="flex justify-between">
            {([1, 2, 3, 4, 5] as Emotion[]).map((e) => (
              <button
                key={e}
                onClick={() => handleEmotion(e)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:bg-carbon-mid"
              >
                <span className="text-2xl">{EMOTION_CONFIG[e].emoji}</span>
                <span className="text-xs font-mono text-gray-600">{EMOTION_CONFIG[e].label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Coach message */}
      <div
        className="mx-4 mb-4 rounded-2xl p-4"
        style={{
          background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}05)`,
          border: `1px solid ${accentColor}33`,
        }}
      >
        <div className="flex items-start gap-3">
          <AvatarDisplay
            archetype="warrior"
            lineage={(profile.lineage as Lineage) || 'spartan'}
            size="sm"
          />
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: accentColor }}>
              Coach · {lineage?.fullName}
            </p>
            <p className="text-white text-sm font-body leading-relaxed italic">
              "{todayPhrase}"
            </p>
            {emotion && (
              <p className="text-gray-500 text-xs font-mono mt-2">
                Mood de hoy: {EMOTION_CONFIG[emotion].emoji} {EMOTION_CONFIG[emotion].label}
                {emotion <= 2 ? ' — Hoy vamos suave, pero vamos.' : ' — ¡A darle con todo!'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Macros del día */}
      <div className="mx-4 mb-4 rounded-2xl p-4 bg-carbon-light">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Nutrición de hoy</p>
          <button className="text-xs font-mono" style={{ color: accentColor }}>Registrar +</button>
        </div>
        <div className="flex items-center justify-between">
          <CalorieRing
            consumed={macros.calories.consumed}
            target={macros.calories.target}
            size={100}
          />
          <div className="flex gap-4">
            <MacroRing
              label="Prot"
              consumed={macros.protein.consumed}
              target={macros.protein.target}
              color="#E23A2E"
              size={60}
            />
            <MacroRing
              label="Carbs"
              consumed={macros.carbs.consumed}
              target={macros.carbs.target}
              color="#6FD3E8"
              size={60}
            />
            <MacroRing
              label="Grasas"
              consumed={macros.fat.consumed}
              target={macros.fat.target}
              color="#DE782C"
              size={60}
            />
          </div>
        </div>
        {/* Water */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm">💧</span>
          <div className="flex-1 h-1.5 rounded-full bg-carbon-mid overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(macros.water.consumed / macros.water.target) * 100}%`,
                background: '#6FD3E8',
              }}
            />
          </div>
          <span className="font-mono text-xs text-gray-500">
            {macros.water.consumed}/{macros.water.target}ml
          </span>
        </div>
        <p className="text-xs font-body text-gray-600 mt-3 italic">
          💡 Aún no has registrado nada hoy — toca "Registrar +" para empezar.
        </p>
      </div>

      {/* Entrenamiento del día */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden bg-carbon-light">
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #252933' }}>
          <div>
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Hoy toca</p>
            <p className="font-display font-bold text-white text-lg uppercase">Fuerza — Tren superior</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs" style={{ color: accentColor }}>
              {doneCount}/{workouts.length}
            </p>
            <p className="font-mono text-xs text-gray-600">ejercicios</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-carbon-mid">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${(doneCount / workouts.length) * 100}%`, background: accentColor }}
          />
        </div>

        <div className="px-4 py-2 space-y-1">
          {workouts.map((w, i) => (
            <button
              key={i}
              onClick={() => toggleWorkout(i)}
              className="w-full flex items-center gap-3 py-2.5 text-left rounded-lg px-1 transition-colors hover:bg-carbon-mid"
            >
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: w.done ? accentColor : '#444',
                  background: w.done ? accentColor : 'transparent',
                }}
              >
                {w.done && <span className="text-carbon text-xs font-black">✓</span>}
              </div>
              <div className="flex-1">
                <p className={`font-body text-sm ${w.done ? 'line-through text-gray-600' : 'text-white'}`}>
                  {w.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-gray-500">{w.sets}</p>
                <p className="font-mono text-xs text-gray-700">{w.weight}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 pb-3 pt-1">
          <button
            className="w-full py-3 rounded-xl font-display font-bold text-sm uppercase tracking-widest transition-all"
            style={{
              background: doneCount === workouts.length ? accentColor : `${accentColor}22`,
              color: doneCount === workouts.length ? '#111318' : accentColor,
              border: `1px solid ${accentColor}44`,
            }}
          >
            {doneCount === workouts.length ? '🔥 SESIÓN COMPLETADA' : '▶ INICIAR SESIÓN'}
          </button>
          <button className="w-full py-2 text-xs font-mono text-gray-600 mt-1">
            No puedo hoy → Versión exprés 15 min
          </button>
        </div>
      </div>

      {/* Nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 safe-bottom"
        style={{
          background: 'rgba(17,19,24,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #1C1F28',
        }}
      >
        {[
          { id: 'home', icon: '🏠', label: 'Inicio' },
          { id: 'workout', icon: '🏋️', label: 'Entrena' },
          { id: 'food', icon: '🍽️', label: 'Comida' },
          { id: 'progress', icon: '📊', label: 'Progreso' },
          { id: 'avatar', icon: '⚡', label: 'Avatar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={
              activeTab === tab.id
                ? { color: accentColor }
                : { color: '#555' }
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="font-mono text-xs">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="w-1 h-1 rounded-full" style={{ background: accentColor }} />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
