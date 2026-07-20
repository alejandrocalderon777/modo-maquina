// Nutri-Score style quality grading (A best → E worst)
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E'

export interface NutriInput {
  cal: number          // kcal / 100g
  prot: number         // g / 100g
  carbs: number
  fat: number
  sugar?: number
  satFat?: number
  salt?: number
  fiber?: number
}

export interface Verdict {
  grade: Grade
  color: string
  label: string
  source: 'oficial' | 'estimado'
  reasons: string[]
}

export const GRADE_COLORS: Record<Grade, string> = {
  A: '#1E8F4E', B: '#7AC943', C: '#F5C518', D: '#F08A24', E: '#E23A2E',
}

export const GRADE_LABELS: Record<Grade, string> = {
  A: 'Excelente', B: 'Buena', C: 'Aceptable', D: 'Baja', E: 'Muy baja',
}

function pointsFor(value: number, thresholds: number[]): number {
  let p = 0
  for (const t of thresholds) if (value > t) p++
  return p
}

const ENERGY_T = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015]
const SUGAR_T  = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31]
const SATFAT_T = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const SALT_T   = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8]
const PROT_T   = [2.4, 4.8, 7.2, 9.6, 12, 14, 17]
const FIBER_T  = [3, 4.1, 5.2, 6.3, 7.4]

export function computeVerdict(input: NutriInput): Verdict {
  const kJ = input.cal * 4.184
  const hasReal = input.sugar !== undefined || input.satFat !== undefined
  const sugar  = input.sugar  ?? Math.max(0, input.carbs * 0.25)
  const satFat = input.satFat ?? input.fat * 0.35
  const salt   = input.salt   ?? 0.3
  const fiber  = input.fiber  ?? 0

  const negative =
    pointsFor(kJ, ENERGY_T) +
    pointsFor(sugar, SUGAR_T) +
    pointsFor(satFat, SATFAT_T) +
    pointsFor(salt, SALT_T)

  const positive = pointsFor(input.prot, PROT_T) + pointsFor(fiber, FIBER_T)
  const score = negative - positive

  const grade: Grade =
    score <= -1 ? 'A' : score <= 2 ? 'B' : score <= 10 ? 'C' : score <= 18 ? 'D' : 'E'

  const reasons: string[] = []
  if (sugar > 15)       reasons.push(`Alto en azúcar (~${Math.round(sugar)}g/100g)`)
  else if (sugar > 8)   reasons.push(`Azúcar moderada (~${Math.round(sugar)}g/100g)`)
  if (satFat > 5)       reasons.push(`Alto en grasas saturadas (~${Math.round(satFat)}g/100g)`)
  if (salt > 1.2)       reasons.push(`Alto en sodio (~${salt.toFixed(1)}g sal/100g)`)
  if (input.cal > 350)  reasons.push(`Muy calórico (${Math.round(input.cal)} kcal/100g)`)
  if (input.prot >= 12) reasons.push(`Buena fuente de proteína (${Math.round(input.prot)}g/100g)`)
  if (fiber >= 5)       reasons.push(`Alto en fibra (${Math.round(fiber)}g/100g)`)
  if (reasons.length === 0) reasons.push('Perfil nutricional equilibrado')

  return { grade, color: GRADE_COLORS[grade], label: GRADE_LABELS[grade], source: hasReal ? 'oficial' : 'estimado', reasons }
}

export function verdictFromOFF(grade: string, input: NutriInput): Verdict {
  const g = grade.toUpperCase() as Grade
  if (!['A','B','C','D','E'].includes(g)) return computeVerdict(input)
  const base = computeVerdict(input)
  return { ...base, grade: g, color: GRADE_COLORS[g], label: GRADE_LABELS[g], source: 'oficial' }
}
