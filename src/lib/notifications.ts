// Notificaciones locales empáticas para la PWA (Notification API)

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

interface ShowOpts { title: string; body: string; tag?: string }

export async function showNotification({ title, body, tag }: ShowOpts) {
  if (notificationPermission() !== 'granted') return
  const opts: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag,
  }
  // Prefer the service worker registration (works when installed as PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) { await reg.showNotification(title, opts); return }
    } catch { /* fall through */ }
  }
  new Notification(title, opts)
}

// ── Mensajes empáticos por linaje ─────────────────────────────
const DAILY_MSGS: Record<string, string[]> = {
  spartan: [
    'Un espartano no negocia con la pereza. ¿Entrenamos hoy?',
    'La disciplina de hoy es la victoria de mañana.',
  ],
  viking: [
    'Los dioses observan. Demuéstrales que eres digno hoy.',
    'El frío forja lo que el calor no puede. A moverse.',
  ],
  mapuche: [
    'El newen está en ti. Despiértalo hoy.',
    'La mapu te da fuerza cuando la respetas. Hoy es el día.',
  ],
}

const INACTIVE_MSGS: Record<string, string> = {
  spartan: 'Te extraño en la batalla. Vuelve, un espartano siempre regresa.',
  viking:  'El barco te espera, guerrero. Volvamos al mar juntos.',
  mapuche: 'La tierra te llama de vuelta. Un paso a la vez, sin culpa.',
}

export function dailyMessage(lineage?: string): string {
  const list = DAILY_MSGS[lineage || 'spartan'] || DAILY_MSGS.spartan
  return list[Math.floor(Math.random() * list.length)]
}

export function inactiveMessage(lineage?: string): string {
  return INACTIVE_MSGS[lineage || 'spartan'] || INACTIVE_MSGS.spartan
}

// Programa el recordatorio diario: revisa cada minuto si es la hora y no se envió hoy
let dailyTimer: ReturnType<typeof setInterval> | null = null

export function scheduleDailyReminder(hour: number, lineage: string | undefined, streakDays: number) {
  if (dailyTimer) clearInterval(dailyTimer)
  const key = 'mm-last-daily-notif'
  const tick = () => {
    if (notificationPermission() !== 'granted') return
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    if (now.getHours() === hour && localStorage.getItem(key) !== todayStr) {
      localStorage.setItem(key, todayStr)
      showNotification({
        title: streakDays > 0 ? `🔥 Racha de ${streakDays} días` : 'Modo Máquina',
        body: dailyMessage(lineage),
        tag: 'daily-reminder',
      })
    }
  }
  dailyTimer = setInterval(tick, 60_000)
  tick()
}
