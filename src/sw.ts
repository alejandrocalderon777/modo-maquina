/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Precache assets inyectados por vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()) })

// ── Push: mostrar notificación aunque la app esté cerrada ──
self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; tag?: string; url?: string } = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data?.text() } }

  const title = data.title || 'Modo Máquina'
  const options: NotificationOptions = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'mm-push',
    data: { url: data.url || '/dashboard' },
    // @ts-expect-error vibrate no está en el tipo pero es válido
    vibrate: [100, 50, 100],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Al tocar la notificación, abrir/enfocar la app ──
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) { client.navigate(url); return client.focus() }
      }
      return self.clients.openWindow(url)
    })
  )
})
