import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://weagmhvylvuthqmutgay.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlYWdtaHZ5bHZ1dGhxbXV0Z2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjQwNzEsImV4cCI6MjA5OTc0MDA3MX0.a7EqYZq8w-oOXiNHnLFTAUBwTBggkCH3NKvoxBOctRg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function analyzePlate(imageBase64: string, mimeType = 'image/jpeg') {
  const { data, error } = await supabase.functions.invoke('analyze-plate', {
    body: { imageBase64, mimeType },
  })
  if (error) throw error
  return data
}
