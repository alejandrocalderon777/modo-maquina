import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC = 'BLlH9qAU_BtOGvZ4jG3yK6qHQCASanuuVjQr0ZTmGveujEBTYJ0tS3Z_MKNETpRekcEhohfDv7eEYNTccUTJoUo'

const DAILY: Record<string, string> = {
  spartan: 'Un espartano no negocia con la pereza. ¿Entrenamos hoy?',
  viking:  'Los dioses observan. Demuéstrales que eres digno hoy.',
  mapuche: 'El newen está en ti. Despiértalo hoy.',
}
const WORKOUT: Record<string, string> = {
  spartan: 'Es tu hora de entrenar. Un espartano cumple.',
  viking:  'Hora de entrenar, guerrero. Al Valhalla se llega entrenando.',
  mapuche: 'Es tu hora de moverte. Despierta el newen.',
}
const FOOD: Record<string, string> = {
  spartan: 'No has registrado tu comida hoy. ¿Qué comiste?',
  viking:  '¿Ya comiste, guerrero? Registra tu alimentación.',
  mapuche: 'No has anotado tu comida. ¿Qué comiste hoy?',
}

function localHourAndDow(tz: string): { hour: number; dow: number; day: string } {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', hour12: false, weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now)
    const get = (t: string) => parts.find(p => p.type === t)?.value || ''
    const hour = parseInt(get('hour'), 10) % 24
    const wd = get('weekday')
    const map: Record<string, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 }
    const dow = map[wd] ?? 0
    const day = `${get('year')}-${get('month')}-${get('day')}`
    return { hour, dow, day }
  } catch {
    const now = new Date()
    return { hour: now.getUTCHours(), dow: now.getUTCDay(), day: now.toISOString().split('T')[0] }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Solo el cron autorizado puede disparar
  const cronKey = req.headers.get('x-cron-key')
  if (cronKey !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })
  }

  webpush.setVapidDetails(
    'mailto:acalderon@spectrumservice.cl',
    VAPID_PUBLIC,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: subs, error } = await supa.from('push_subscriptions').select('*')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })

  let sent = 0
  for (const sub of subs || []) {
    const s = sub.settings || {}
    const { hour, dow, day } = localHourAndDow(sub.timezone || 'UTC')
    const lineage = s.lineage || 'spartan'
    const lastSent = sub.last_sent || {}
    const toSend: { title: string; body: string; tag: string }[] = []

    // 1) Recordatorio diario
    if (typeof s.dailyHour === 'number' && hour === s.dailyHour && lastSent.daily !== day) {
      toSend.push({ title: 'Modo Máquina', body: DAILY[lineage] || DAILY.spartan, tag: 'daily' })
      lastSent.daily = day
    }
    // 2) Entrenamiento
    if (s.workoutEnabled && Array.isArray(s.workoutDays) && s.workoutDays.includes(dow) &&
        hour === s.workoutHour && lastSent.workout !== day) {
      toSend.push({ title: '🏋️ Hora de entrenar', body: WORKOUT[lineage] || WORKOUT.spartan, tag: 'workout' })
      lastSent.workout = day
    }
    // 3) Comida — solo si no registró hoy
    if (s.foodEnabled && hour === s.foodHour && lastSent.food !== day) {
      const { data: ud } = await supa.from('user_data').select('data').eq('user_id', sub.user_id).maybeSingle()
      const foodLog = (ud?.data?.foodLog as { date: string }[]) || []
      const ate = foodLog.some(e => e.date === day)
      if (!ate) {
        toSend.push({ title: '🍽️ ¿Ya comiste?', body: FOOD[lineage] || FOOD.spartan, tag: 'food' })
        lastSent.food = day
      }
    }

    for (const msg of toSend) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ ...msg, url: '/dashboard' }),
        )
        sent++
      } catch (err) {
        // Suscripción expirada/ inválida → limpiar
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await supa.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    if (toSend.length > 0) {
      await supa.from('push_subscriptions').update({ last_sent: lastSent }).eq('endpoint', sub.endpoint)
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
