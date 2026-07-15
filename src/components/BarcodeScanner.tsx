import { useEffect, useRef, useState } from 'react'

interface Props {
  onResult: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [hasDetector, setHasDetector] = useState(true)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const doneRef = useRef(false)

  useEffect(() => {
    const supportsDetector = 'BarcodeDetector' in window
    setHasDetector(supportsDetector)

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          await videoRef.current.play()
        }

        if (supportsDetector) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e', 'code_39', 'qr_code'],
          })
          scanLoop(detector)
        }
      } catch {
        setError('No se pudo acceder a la cámara. Verifica los permisos en tu navegador.')
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scanLoop = async (detector: any) => {
      if (doneRef.current) return
      const video = videoRef.current
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(() => scanLoop(detector))
        return
      }
      try {
        const barcodes = await detector.detect(video)
        if (barcodes.length > 0 && !doneRef.current) {
          doneRef.current = true
          stopStream()
          onResult(barcodes[0].rawValue)
          return
        }
      } catch {/* frame error, keep scanning */}
      rafRef.current = requestAnimationFrame(() => scanLoop(detector))
    }

    start()

    return () => {
      doneRef.current = true
      cancelAnimationFrame(rafRef.current)
      stopStream()
    }
  }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const handleManual = () => {
    const code = manualCode.trim()
    if (code.length >= 8) {
      doneRef.current = true
      stopStream()
      onResult(code)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-carbon">
        <div>
          <h2 className="font-display font-black text-2xl text-white uppercase">Escanear producto</h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">Apunta al código de barras</p>
        </div>
        <button
          onClick={() => { stopStream(); onClose() }}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white text-xl"
        >✕</button>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-carbon">
          <p className="text-5xl mb-4">📷</p>
          <p className="text-white font-display font-bold text-lg mb-2">Sin acceso a cámara</p>
          <p className="text-gray-400 text-sm font-body mb-6">{error}</p>
          <button onClick={() => { stopStream(); onClose() }}
            className="px-6 py-3 rounded-xl bg-volt text-carbon font-display font-bold uppercase text-sm">
            Volver
          </button>
        </div>
      ) : (
        <>
          {/* Camera feed — full width, fills space */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dark mask with hole */}
              <div className="absolute inset-0 bg-black/50" />
              {/* Scan box */}
              <div className="relative z-10 w-72 h-40 rounded-2xl"
                style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', border: '2px solid #CEFF3C' }}>
                {/* Corners */}
                <span className="absolute -top-px -left-px w-7 h-7 border-l-4 border-t-4 border-volt rounded-tl-xl" />
                <span className="absolute -top-px -right-px w-7 h-7 border-r-4 border-t-4 border-volt rounded-tr-xl" />
                <span className="absolute -bottom-px -left-px w-7 h-7 border-l-4 border-b-4 border-volt rounded-bl-xl" />
                <span className="absolute -bottom-px -right-px w-7 h-7 border-r-4 border-b-4 border-volt rounded-br-xl" />
                {/* Scan line */}
                <div className="absolute inset-x-2 h-0.5 bg-volt opacity-80 rounded-full"
                  style={{ animation: 'scanline 2s ease-in-out infinite', top: '50%' }} />
              </div>
            </div>

            {!hasDetector && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-xl px-4 py-2 text-center">
                <p className="text-yellow-400 text-xs font-mono">
                  Tu navegador no soporta detección automática. Ingresa el código manualmente abajo.
                </p>
              </div>
            )}
          </div>

          {/* Manual entry fallback */}
          <div className="bg-carbon px-4 py-4">
            <p className="text-gray-500 text-xs font-mono text-center mb-3">
              {hasDetector ? 'O ingresa el código manualmente' : 'Ingresa el código manualmente'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManual()}
                placeholder="7891234567890"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-base focus:outline-none focus:border-volt"
              />
              <button
                onClick={handleManual}
                disabled={manualCode.trim().length < 8}
                className="px-4 py-3 rounded-xl font-display font-bold uppercase text-carbon text-sm disabled:opacity-40"
                style={{ background: '#CEFF3C' }}
              >Buscar</button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-30px); opacity: 0.5; }
          50% { transform: translateY(30px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
