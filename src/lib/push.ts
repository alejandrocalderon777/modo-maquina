import { supabase, getSession } from './supabase'

const VAPID_PUBLIC_KEY = 'BLlH9qAU_BtOGvZ4jG3yK6qHQCASanuuVjQr0ZTmGveujEBTYJ0tS3Z_MKNETpRekcEhohfDv7eEYNTccUTJoUo'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export interface ReminderSettings {
  dailyHour: number
  workoutEnabled: boolean
  workoutDays: number[]
  workoutHour: number
  foodEnabled: boolean
  foodHour: number
  lineage?: string
}

// Suscribe al dispositivo y guarda la suscripción + config en Supabase
export async function subscribeToPush(settings: ReminderSettings): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const session = await getSession()
  if (!session) return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const json = sub.toJSON()

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: session.user.id,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    timezone: tz,
    settings,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' })

  if (error) { console.error('subscribeToPush', error); return false }
  return true
}

// Actualiza solo la configuración de horarios (sin re-suscribir)
export async function updatePushSettings(settings: ReminderSettings) {
  const session = await getSession()
  if (!session) return
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('endpoint', sub.endpoint)
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
}
