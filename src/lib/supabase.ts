import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://weagmhvylvuthqmutgay.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYWdtaHZ5bHZ1dGhxbXV0Z2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjQwNzEsImV4cCI6MjA5OTc0MDA3MX0.a7EqYZq8w-oOXiNHnLFTAUBwTBggkCH3NKvoxBOctRg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
