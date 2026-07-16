import { useEffect, useRef } from 'react'

interface Props {
  onCapture: (video: HTMLVideoElement) => void
  accentColor: string
  mode: 'plate' | 'label'
}

export function PlateCamera({ onCapture, accentColor, mode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(s => {
      stream = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
    }).catch(console.error)
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  return (
    <div className="flex-1 flex flex-col relative">
      <video ref={videoRef} autoPlay playsInline muted
        className="flex-1 w-full object-cover" style={{ background: '#000' }} />

      {/* Guide overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="rounded-2xl" style={{
          width: '85%', height: mode === 'label' ? '45%' : '65%',
          border: `2px solid ${accentColor}88`,
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`
        }}/>
      </div>

      {/* Hint */}
      <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
        <div className="px-4 py-2 rounded-full font-mono text-xs"
          style={{ background: 'rgba(0,0,0,0.6)', color: accentColor }}>
          {mode === 'plate' ? 'Encuadra tu plato de comida' : 'Encuadra la etiqueta nutricional'}
        </div>
      </div>

      {/* Capture button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={() => videoRef.current && onCapture(videoRef.current)}
          className="rounded-full flex items-center justify-center"
          style={{
            width: 72, height: 72,
            background: accentColor,
            boxShadow: `0 0 0 4px rgba(255,255,255,0.2)`
          }}>
          <div className="rounded-full bg-white" style={{ width: 28, height: 28 }} />
        </button>
      </div>
    </div>
  )
}
