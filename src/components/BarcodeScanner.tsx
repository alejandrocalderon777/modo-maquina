import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onResult: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const divId = 'barcode-scanner-div'

  useEffect(() => {
    const scanner = new Html5Qrcode(divId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 160 } },
      (decodedText) => {
        setScanning(false)
        scanner.stop().catch(() => {})
        onResult(decodedText)
      },
      () => { /* scan error - ignore */ }
    ).catch(() => {
      setError('No se pudo acceder a la cámara. Permite el acceso en tu navegador.')
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-carbon">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div>
          <h2 className="font-display font-black text-2xl text-white uppercase">Escanear código</h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">Apunta al código de barras del producto</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white">
          ✕
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {error ? (
          <div className="text-center px-6">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-white font-display font-bold text-lg mb-2">Sin acceso a cámara</p>
            <p className="text-gray-500 text-sm font-body mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-volt text-carbon font-display font-bold uppercase text-sm"
            >
              Volver
            </button>
          </div>
        ) : (
          <>
            {/* Scanner box */}
            <div className="w-full max-w-sm rounded-2xl overflow-hidden relative" style={{ border: '2px solid #CEFF3C33' }}>
              <div id={divId} className="w-full" />
              {/* Corner guides */}
              {scanning && (
                <>
                  <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-volt rounded-tl-lg pointer-events-none" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-volt rounded-tr-lg pointer-events-none" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-volt rounded-bl-lg pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-volt rounded-br-lg pointer-events-none" />
                  {/* Scan line animation */}
                  <div className="absolute inset-x-4 h-0.5 bg-volt opacity-70 pointer-events-none animate-scan-line" style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
                </>
              )}
            </div>
            <p className="text-gray-500 text-xs font-mono mt-4 text-center">
              Centra el código de barras en el recuadro
            </p>
          </>
        )}
      </div>

      {/* Bottom tip */}
      <div className="px-4 pb-10">
        <div className="bg-gray-900 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-xs font-body">
            Compatible con productos de supermercados, proteínas, suplementos y más.
            Base de datos: <span className="text-volt">Open Food Facts</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-40px); opacity: 0.4; }
          50% { transform: translateY(40px); opacity: 1; }
        }
        #${divId} video { width: 100% !important; border-radius: 0 !important; }
        #${divId} img { display: none !important; }
      `}</style>
    </div>
  )
}
