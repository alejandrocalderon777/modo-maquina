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


const WORKOUT_MSGS: Record<string, string[]> = {
  spartan: ['Es tu hora de entrenar. Un espartano cumple.', 'La batalla te espera. A entrenar.'],
  viking:  ['Hora de entrenar, guerrero. Al Valhalla se llega entrenando.', 'El hierro te llama. Vamos.'],
  mapuche: ['Es tu hora de moverte. Despierta el newen.', 'La fuerza de la tierra te espera. A entrenar.'],
}
const FOOD_MSGS: Record<string, string> = {
  spartan: 'No has registrado tu comida hoy. Un espartano controla lo que come. ¿Qué comiste?',
  viking:  '¿Ya comiste, guerrero? Registra tu alimentación para seguir fuerte.',
  mapuche: 'No has anotado tu comida. El alimento es parte del equilibrio. ¿Qué comiste hoy?',
}

export function workoutMessage(lineage?: string): string {
  const list = WORKOUT_MSGS[lineage || 'spartan'] || WORKOUT_MSGS.spartan
  return list[Math.floor(Math.random() * list.length)]
}
export function foodMessage(lineage?: string): string {
  return FOOD_MSGS[lineage || 'spartan'] || FOOD_MSGS.spartan
}

interface ReminderConfig {
  dailyHour: number
  lineage?: string
  streakDays: number
  workoutTimes: Record<number, string>  // dow 0=Dom..6=Sáb -> 'HH:MM'
  workoutEnabled: boolean
  foodEnabled: boolean
  foodHour: number            // hora a la que revisa si registraste comida
  hasFoodToday: () => boolean // callback para saber si hay registro de comida hoy
}

export function scheduleReminders(cfg: ReminderConfig) {
  if (dailyTimer) clearInterval(dailyTimer)
  const fired = (key: string, day: string) => localStorage.getItem(key) === day
  const mark = (key: string, day: string) => localStorage.setItem(key, day)

  const tick = () => {
    if (notificationPermission() !== 'granted') return
    const now = new Date()
    const day = now.toISOString().split('T')[0]
    const h = now.getHours()
    const dow = now.getDay()

    // 1) Recordatorio diario motivacional
    if (h === cfg.dailyHour && !fired('mm-last-daily-notif', day)) {
      mark('mm-last-daily-notif', day)
      showNotification({
        title: cfg.streakDays > 0 ? `🔥 Racha de ${cfg.streakDays} días` : 'Modo Máquina',
        body: dailyMessage(cfg.lineage),
        tag: 'daily-reminder',
      })
    }

    // 2) Recordatorio de entrenamiento (por día, a la hora definida en Mi Plan)
    const wTime = cfg.workoutTimes[dow]
    if (cfg.workoutEnabled && wTime && !fired('mm-last-workout-notif', day)) {
      const [wh, wm] = wTime.split(':').map(Number)
      const nowMin = h * 60 + now.getMinutes()
      if (nowMin >= wh * 60 + (wm || 0)) {
        mark('mm-last-workout-notif', day)
        showNotification({ title: '🏋️ Hora de entrenar', body: workoutMessage(cfg.lineage), tag: 'workout-reminder' })
      }
    }

    // 3) Aviso de comida: si a la hora fijada no hay registro de comida hoy
    if (cfg.foodEnabled && h === cfg.foodHour && !fired('mm-last-food-notif', day) && !cfg.hasFoodToday()) {
      mark('mm-last-food-notif', day)
      showNotification({ title: '🍽️ ¿Ya comiste?', body: foodMessage(cfg.lineage), tag: 'food-reminder' })
    }
  }

  dailyTimer = setInterval(tick, 60_000)
  tick()
}
