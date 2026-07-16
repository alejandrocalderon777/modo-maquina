import { useEffect, useRef, useState } from 'react'

interface Props {
  onCapture: (video: HTMLVideoElement) => void
  onCaptureFile?: (base64: string, mimeType: string) => void
  accentColor: string
  mode: 'plate' | 'label'
}

export function PlateCamera({ onCapture, onCaptureFile, accentColor, mode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play()
          setReady(true)
        }
      } catch (e) {
        console.error('camera error', e)
        setFailed(true)
      }
    }
    start()
    return () => { cancelled = true; stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onCaptureFile) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      onCaptureFile(base64, file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  // Fallback: camera failed → offer file picker (opens native camera on mobile)
  if (failed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handleFile} />
        <p className="text-5xl">📷</p>
        <p className="text-white font-body text-center text-sm">
          No se pudo abrir la cámara en vivo.<br/>Toma la foto con tu cámara o elige de la galería.
        </p>
        <button type="button" onClick={() => fileRef.current?.click()}
          className="px-6 py-3.5 rounded-2xl font-display font-black text-base active:scale-95 transition-transform"
          style={{ background: accentColor, color: '#111318' }}>
          📸 Abrir cámara / galería
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative" style={{ minHeight: 0 }}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={handleFile} />

      <video ref={videoRef} autoPlay playsInline muted
        className="flex-1 w-full object-cover" style={{ background: '#000', minHeight: 0 }} />

      {/* Guide overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{
          width: '85%', height: mode === 'label' ? '42%' : '60%',
          borderRadius: 16,
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`
        }}/>
      </div>

      {/* Hint */}
      <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ top: 16 }}>
        <div className="px-4 py-2 rounded-full font-mono text-xs"
          style={{ background: 'rgba(0,0,0,0.65)', color: accentColor }}>
          {mode === 'plate' ? 'Encuadra tu plato de comida' : 'Encuadra la etiqueta nutricional'}
        </div>
      </div>

      {/* Bottom controls bar (with safe-area) */}
      <div className="absolute left-0 right-0 flex items-center justify-center gap-8"
        style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)', paddingTop: 20,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>

        {/* Gallery / file fallback */}
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <span className="text-lg">🖼️</span>
          </div>
        </button>

        {/* Shutter */}
        <button type="button" disabled={!ready}
          onClick={() => videoRef.current && onCapture(videoRef.current)}
          className="rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{
            width: 76, height: 76,
            background: ready ? accentColor : '#555',
            boxShadow: `0 0 0 4px rgba(255,255,255,0.25)`,
            opacity: ready ? 1 : 0.6,
          }}>
          <div className="rounded-full bg-white" style={{ width: 30, height: 30 }} />
        </button>

        {/* Spacer to balance layout */}
        <div className="w-11" />
      </div>

      {/* Loading indicator */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 rounded-full animate-spin"
              style={{ borderColor: `${accentColor}44`, borderTopColor: accentColor, borderWidth: 3 }}/>
            <p className="font-mono text-xs" style={{ color: accentColor }}>Iniciando cámara…</p>
          </div>
        </div>
      )}
    </div>
  )
}
