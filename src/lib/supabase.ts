import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://weagmhvylvuthqmutgay.supabase.co'
const SUPABASE_KEY = 'sb_publishable_4Jd-4BvOO55GVjeB-yQXyw_neM5dauT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
