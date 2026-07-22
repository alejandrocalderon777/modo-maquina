// Deportes con MET (equivalente metabólico) para estimar calorías
// kcal = MET × peso(kg) × horas
export interface Sport {
  id: string
  name: string
  emoji: string
  met: number
  type: 'cardio' | 'fuerza' | 'mixto'
}

export const SPORTS: Sport[] = [
  { id:'futbol',    name:'Fútbol',        emoji:'⚽', met:7.0, type:'cardio' },
  { id:'padel',     name:'Pádel',         emoji:'🎾', met:7.0, type:'cardio' },
  { id:'tenis',     name:'Tenis',         emoji:'🎾', met:7.3, type:'cardio' },
  { id:'natacion',  name:'Natación',      emoji:'🏊', met:8.0, type:'cardio' },
  { id:'bici',      name:'Bicicleta',     emoji:'🚴', met:7.5, type:'cardio' },
  { id:'trote',     name:'Trote / running', emoji:'🏃', met:9.0, type:'cardio' },
  { id:'basquet',   name:'Básquetbol',    emoji:'🏀', met:6.5, type:'cardio' },
  { id:'volei',     name:'Vóleibol',      emoji:'🏐', met:5.0, type:'cardio' },
  { id:'crossfit',  name:'Crossfit / funcional', emoji:'🏋️', met:8.0, type:'mixto' },
  { id:'escalada',  name:'Escalada',      emoji:'🧗', met:8.0, type:'fuerza' },
  { id:'trekking',  name:'Trekking',      emoji:'🥾', met:6.0, type:'cardio' },
  { id:'baile',     name:'Baile',         emoji:'💃', met:5.5, type:'cardio' },
  { id:'yoga',      name:'Yoga',          emoji:'🧘', met:3.0, type:'fuerza' },
  { id:'caminata',  name:'Caminata',      emoji:'🚶', met:3.5, type:'cardio' },
  { id:'boxeo',     name:'Boxeo',         emoji:'🥊', met:8.5, type:'mixto' },
  { id:'surf',      name:'Surf',          emoji:'🏄', met:5.0, type:'mixto' },
]

export function estimateCalories(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * (weightKg || 75) * (minutes / 60))
}
