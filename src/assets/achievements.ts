import type { AppState } from '../types'

export type Tier = 'bronce' | 'plata' | 'oro' | 'legendario'
export type Category = 'Racha' | 'Nutrición' | 'Entrenamiento' | 'Progreso' | 'Especial'

export interface Achievement {
  id: string
  name: string
  desc: string
  emoji: string
  tier: Tier
  category: Category
  xp: number
  check: (s: AppState) => boolean
  progress?: (s: AppState) => { current: number; target: number }
}

export const TIER_COLORS: Record<Tier, string> = {
  bronce: '#C87F3C',
  plata: '#B8C0CC',
  oro: '#E8B923',
  legendario: '#CEFF3C',
}

// ── helpers ──
const workoutDays = (s: AppState) =>
  Object.values(s.workoutCompletions || {}).filter(v => v.length > 0).length
const fullSessions = (s: AppState) =>
  Object.values(s.workoutCompletions || {}).filter(v => v.length >= 4).length
const foodDays = (s: AppState) =>
  new Set(s.foodLog.map(e => e.date)).size
const hasMeasurements = (s: AppState) =>
  Boolean(s.measurements?.weight && s.measurements?.height)

export const ACHIEVEMENTS: Achievement[] = [
  // ── RACHA ──
  { id:'streak_1',   name:'Primera chispa',   desc:'Activa el modo máquina por primera vez', emoji:'⚡', tier:'bronce', category:'Racha', xp:50,
    check: s => s.streakDays >= 1 },
  { id:'streak_7',   name:'Semana máquina',   desc:'7 días seguidos de constancia', emoji:'🔥', tier:'bronce', category:'Racha', xp:100,
    check: s => (s.maxStreak || s.streakDays) >= 7,
    progress: s => ({ current: Math.min(s.maxStreak || s.streakDays, 7), target: 7 }) },
  { id:'streak_15',  name:'Quincena de hierro', desc:'15 días sin fallar', emoji:'🛡️', tier:'plata', category:'Racha', xp:200,
    check: s => (s.maxStreak || s.streakDays) >= 15,
    progress: s => ({ current: Math.min(s.maxStreak || s.streakDays, 15), target: 15 }) },
  { id:'streak_30',  name:'Mes imparable',    desc:'30 días de racha — el hábito ya es tuyo', emoji:'💎', tier:'oro', category:'Racha', xp:400,
    check: s => (s.maxStreak || s.streakDays) >= 30,
    progress: s => ({ current: Math.min(s.maxStreak || s.streakDays, 30), target: 30 }) },
  { id:'streak_90',  name:'Trimestre guerrero', desc:'90 días. Esto ya es tu forma de vivir', emoji:'👑', tier:'oro', category:'Racha', xp:800,
    check: s => (s.maxStreak || s.streakDays) >= 90,
    progress: s => ({ current: Math.min(s.maxStreak || s.streakDays, 90), target: 90 }) },
  { id:'streak_365', name:'Año máquina',      desc:'365 días. Leyenda viviente', emoji:'🏆', tier:'legendario', category:'Racha', xp:3000,
    check: s => (s.maxStreak || s.streakDays) >= 365,
    progress: s => ({ current: Math.min(s.maxStreak || s.streakDays, 365), target: 365 }) },

  // ── NUTRICIÓN ──
  { id:'food_1',    name:'Primer registro',   desc:'Registra tu primera comida', emoji:'🍽️', tier:'bronce', category:'Nutrición', xp:50,
    check: s => s.foodLog.length >= 1 },
  { id:'food_50',   name:'Contador serio',    desc:'50 alimentos registrados', emoji:'📋', tier:'bronce', category:'Nutrición', xp:150,
    check: s => s.foodLog.length >= 50,
    progress: s => ({ current: Math.min(s.foodLog.length, 50), target: 50 }) },
  { id:'food_200',  name:'Maestro del plato', desc:'200 alimentos registrados', emoji:'🥇', tier:'plata', category:'Nutrición', xp:400,
    check: s => s.foodLog.length >= 200,
    progress: s => ({ current: Math.min(s.foodLog.length, 200), target: 200 }) },
  { id:'food_days_30', name:'Mes consciente', desc:'Registra comida 30 días distintos', emoji:'📅', tier:'oro', category:'Nutrición', xp:500,
    check: s => foodDays(s) >= 30,
    progress: s => ({ current: Math.min(foodDays(s), 30), target: 30 }) },
  { id:'protein_goal', name:'Proteína cumplida', desc:'Alcanza tu meta diaria de proteína', emoji:'🥩', tier:'bronce', category:'Nutrición', xp:100,
    check: s => s.macros.protein.consumed >= s.macros.protein.target && s.macros.protein.target > 0 },
  { id:'water_goal', name:'Bien hidratado',   desc:'Alcanza tu meta diaria de agua', emoji:'💧', tier:'bronce', category:'Nutrición', xp:80,
    check: s => s.macros.water.consumed >= s.macros.water.target && s.macros.water.target > 0 },
  { id:'perfect_day', name:'Día perfecto',    desc:'Cumple calorías, proteína y agua el mismo día', emoji:'✨', tier:'oro', category:'Nutrición', xp:300,
    check: s => s.macros.calories.consumed >= s.macros.calories.target * 0.9 &&
                s.macros.protein.consumed  >= s.macros.protein.target &&
                s.macros.water.consumed    >= s.macros.water.target },

  // ── ENTRENAMIENTO ──
  { id:'wod_1',   name:'Primer entreno',    desc:'Completa tu primer ejercicio', emoji:'🏋️', tier:'bronce', category:'Entrenamiento', xp:50,
    check: s => workoutDays(s) >= 1 },
  { id:'wod_10',  name:'Constancia física', desc:'Entrena 10 días', emoji:'💪', tier:'bronce', category:'Entrenamiento', xp:150,
    check: s => workoutDays(s) >= 10,
    progress: s => ({ current: Math.min(workoutDays(s), 10), target: 10 }) },
  { id:'wod_50',  name:'Forjado en hierro', desc:'Entrena 50 días', emoji:'⚔️', tier:'plata', category:'Entrenamiento', xp:400,
    check: s => workoutDays(s) >= 50,
    progress: s => ({ current: Math.min(workoutDays(s), 50), target: 50 }) },
  { id:'wod_100', name:'Centurión',         desc:'Entrena 100 días', emoji:'🏛️', tier:'oro', category:'Entrenamiento', xp:1000,
    check: s => workoutDays(s) >= 100,
    progress: s => ({ current: Math.min(workoutDays(s), 100), target: 100 }) },
  { id:'wod_full_10', name:'Sesiones completas', desc:'Completa 10 sesiones enteras', emoji:'🎯', tier:'plata', category:'Entrenamiento', xp:300,
    check: s => fullSessions(s) >= 10,
    progress: s => ({ current: Math.min(fullSessions(s), 10), target: 10 }) },

  // ── PROGRESO ──
  { id:'measure_1',  name:'Punto de partida', desc:'Registra tus primeras medidas', emoji:'📏', tier:'bronce', category:'Progreso', xp:100,
    check: s => hasMeasurements(s) },
  { id:'photo_1',    name:'Antes',            desc:'Sube tu primera foto de progreso', emoji:'📸', tier:'bronce', category:'Progreso', xp:100,
    check: s => s.bodyPhotos.length >= 1 },
  { id:'photo_3',    name:'Evolución visible', desc:'3 fotos para comparar tu cambio', emoji:'🔄', tier:'plata', category:'Progreso', xp:250,
    check: s => s.bodyPhotos.length >= 3,
    progress: s => ({ current: Math.min(s.bodyPhotos.length, 3), target: 3 }) },

  // ── ESPECIAL ──
  { id:'level_5',   name:'Nivel 5',         desc:'Alcanza el nivel 5 de tu linaje', emoji:'🌟', tier:'plata', category:'Especial', xp:300,
    check: s => Math.floor(s.xpPoints / 500) + 1 >= 5,
    progress: s => ({ current: Math.min(Math.floor(s.xpPoints / 500) + 1, 5), target: 5 }) },
  { id:'level_10',  name:'Nivel 10',        desc:'Alcanza el nivel 10 — élite de tu linaje', emoji:'👑', tier:'oro', category:'Especial', xp:800,
    check: s => Math.floor(s.xpPoints / 500) + 1 >= 10,
    progress: s => ({ current: Math.min(Math.floor(s.xpPoints / 500) + 1, 10), target: 10 }) },
  { id:'saved_streak', name:'Salvado por el escudo', desc:'Un protector rescató tu racha', emoji:'🛡️', tier:'bronce', category:'Especial', xp:100,
    check: s => s.streakProtectors < 2 },
]

export function evaluateAchievements(s: AppState, unlocked: string[]): string[] {
  return ACHIEVEMENTS
    .filter(a => !unlocked.includes(a.id) && a.check(s))
    .map(a => a.id)
}

export function getAchievement(id: string) {
  return ACHIEVEMENTS.find(a => a.id === id)
}
