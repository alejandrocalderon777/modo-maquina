import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://weagmhvylvuthqmutgay.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYWdtaHZ5bHZ1dGhxbXV0Z2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjQwNzEsImV4cCI6MjA5OTc0MDA3MX0.a7EqYZq8w-oOXiNHnLFTAUBwTBggkCH3NKvoxBOctRg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ── Auth helpers ─────────────────────────────────────────────
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// ── Cloud sync (whole-state JSONB) ───────────────────────────
export async function loadUserData(): Promise<Record<string, unknown> | null> {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (error) { console.error('loadUserData', error); return null }
  return (data?.data as Record<string, unknown>) || null
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
export async function saveUserData(state: Record<string, unknown>) {
  const session = await getSession()
  if (!session) return
  // debounce writes
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const { error } = await supabase
      .from('user_data')
      .upsert({ user_id: session.user.id, data: state, updated_at: new Date().toISOString() })
    if (error) console.error('saveUserData', error)
  }, 1500)
}

export async function analyzePlate(
  imageBase64: string,
  mimeType = 'image/jpeg',
  mode: 'plate' | 'label' = 'plate'
) {
  const { data, error } = await supabase.functions.invoke('analyze-plate', {
    body: { imageBase64, mimeType, mode },
  })
  if (error) throw error
  return data
}

export interface GeneratedRecipe {
  name: string; emoji: string; tag: string; time: number
  cal: number; prot: number; carbs: number; fat: number
  servings: number; category: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack'
  ingredients: { name: string; amount: string }[]
  steps: string[]
}

export async function generateRecipe(params: {
  prompt?: string; goal?: string; mealType?: string; ingredients?: string
}): Promise<GeneratedRecipe> {
  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: params,
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export interface AIFood {
  nombre: string; cal: number; prot: number; carbs: number; fat: number; unidad: string
}

export async function lookupFoodAI(query: string): Promise<AIFood[]> {
  const { data, error } = await supabase.functions.invoke('lookup-food', {
    body: { query },
  })
  if (error) throw error
  return data?.resultados || []
}

export interface AdjustedPlan {
  plan: { day: string; type: string; muscles: string[]; note: string }[]
  resumen: string
}

export async function adjustWorkout(params: {
  currentPlan: { day: string; type: string; done: boolean }[]
  missedDays: string[]
  remainingDays: string[]
  goal?: string
  level?: string
  daysPerWeek?: number
}): Promise<AdjustedPlan> {
  const { data, error } = await supabase.functions.invoke('adjust-workout', { body: params })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
