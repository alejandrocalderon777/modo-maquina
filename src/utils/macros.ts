interface MacroInput {
  weight: number   // kg
  height: number   // cm
  age?: number     // years (default 30)
  sex?: 'male' | 'female'
  goal?: string    // lose_weight | gain_muscle | health | endurance
  level?: string   // sedentary | beginner | intermediate | advanced
  daysPerWeek?: number | string
}

export interface MacroResult {
  calories: number
  protein: number  // g
  carbs: number    // g
  fat: number      // g
  tdee: number
  deficit: number  // % adjustment applied
}

export function calculateMacros(input: MacroInput): MacroResult {
  const { weight, height, age = 30, sex = 'male', goal = 'health', level = 'beginner' } = input

  // Mifflin-St Jeor BMR
  const bmr = sex === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161

  // Activity multiplier
  const activityMap: Record<string, number> = {
    sedentary: 1.2,
    beginner: 1.375,
    intermediate: 1.55,
    advanced: 1.725,
  }
  const tdee = Math.round(bmr * (activityMap[level] ?? 1.375))

  // Goal adjustments
  const adjustments: Record<string, number> = {
    lose_weight: -0.20,
    gain_muscle: +0.10,
    health: 0,
    endurance: +0.05,
  }
  const deficit = adjustments[goal] ?? 0
  const calories = Math.round(tdee * (1 + deficit))

  // Protein targets (g/kg)
  const proteinPerKg: Record<string, number> = {
    lose_weight: 2.4,
    gain_muscle: 2.2,
    health: 1.8,
    endurance: 1.6,
  }
  const protein = Math.round((proteinPerKg[goal] ?? 2.0) * weight)

  // Fat: 25–30% of calories
  const fatPct = goal === 'endurance' ? 0.20 : 0.25
  const fat = Math.round((calories * fatPct) / 9)

  // Carbs: remainder
  const proteinCals = protein * 4
  const fatCals = fat * 9
  const carbs = Math.max(50, Math.round((calories - proteinCals - fatCals) / 4))

  return { calories, protein, carbs, fat, tdee, deficit }
}

export const GOAL_LABELS: Record<string, { label: string; desc: string; emoji: string }> = {
  lose_weight: { emoji: '🔥', label: 'Pérdida de grasa',   desc: 'Déficit calórico del 20%' },
  gain_muscle: { emoji: '💪', label: 'Ganar músculo',      desc: 'Superávit del 10%' },
  health:      { emoji: '❤️', label: 'Salud general',       desc: 'Calorías de mantenimiento' },
  endurance:   { emoji: '⚡', label: 'Resistencia',         desc: 'Combustible para el rendimiento' },
}
