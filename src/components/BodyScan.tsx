import { useRef, useState } from 'react'

interface Props {
  onPhoto: (dataUrl: string) => void
  onClose: () => void
  accentColor?: string
}

async function compressImage(file: File, maxPx = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

type Step = 'instructions' | 'preview'

export default function BodyScan({ onPhoto, onClose, accentColor = '#CEFF3C' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('instructions')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const compressed = await compressImage(file)
      setPreviewUrl(compressed)
      setStep('preview')
    } catch {
      alert('No se pudo procesar la imagen. Intenta de nuevo.')
    } finally {
      setCompressing(false)
    }
  }

  const handleConfirm = () => {
    if (previewUrl) onPhoto(previewUrl)
  }

  const handleRetake = () => {
    setPreviewUrl(null)
    setStep('instructions')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-carbon">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
        <div>
          <h2 className="font-display font-black text-2xl text-white uppercase">Foto corporal</h2>
          <p className="text-gray-500 text-xs font-mono mt-0.5">
            {step === 'instructions' ? 'Sigue las instrucciones' : 'Confirma tu foto'}
          </p>
        </div>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white text-xl">
          ✕
        </button>
      </div>

      {step === 'instructions' && (
        <div className="flex-1 flex flex-col px-5 py-6 overflow-y-auto">
          {/* Purpose */}
          <div className="rounded-2xl p-4 mb-6" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: accentColor }}>¿Para qué sirve?</p>
            <p className="text-gray-300 text-sm font-body leading-relaxed">
              Guardamos una foto de referencia hoy. Cada mes repites desde el mismo lugar y comparamos visualmente tu progreso real — más honesto que sólo el peso en la balanza.
            </p>
          </div>

          {/* Step-by-step instructions */}
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">Cómo hacerlo</p>
          <div className="space-y-4">
            {[
              {
                n: '1',
                icon: '📱',
                title: 'Apoya el teléfono',
                desc: 'Colócalo a unos 1,5 metros de distancia, a la altura del pecho. Usa un vaso, libro o pídele a alguien que lo sostenga.',
              },
              {
                n: '2',
                icon: '👕',
                title: 'Ropa ajustada o sin',
                desc: 'Usa ropa que muestre tu silueta (polera ajustada, shorts). Mantén el mismo criterio cada mes para comparar parejo.',
              },
              {
                n: '3',
                icon: '🧍',
                title: 'Postura neutral',
                desc: 'Párate de frente, brazos ligeramente separados del cuerpo, pies al ancho de los hombros. Sin inflar ni hundir el estómago.',
              },
              {
                n: '4',
                icon: '📍',
                title: 'Marca el lugar',
                desc: 'Anota o fotografía el lugar donde pusiste el teléfono. El mes siguiente repite exactamente desde ahí.',
              },
            ].map((s) => (
              <div key={s.n} className="flex gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: '#1C1F28' }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-white font-display font-bold text-sm">{s.title}</p>
                  <p className="text-gray-500 text-xs font-body leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Selfie tip */}
          <div className="mt-6 p-3 rounded-xl bg-gray-900 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-gray-400 text-xs font-body">
              Si estás solo, usa el temporizador de la cámara nativa (suele ser 3 o 10 seg) antes de abrir esta app.
              También puedes tomar la foto desde la galería si ya la tienes.
            </p>
          </div>

          <div className="mt-auto pt-6 space-y-3">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={compressing}
              className="w-full py-4 rounded-2xl font-display font-black uppercase text-lg tracking-widest disabled:opacity-50 active:scale-95 transition-transform"
              style={{ background: accentColor, color: '#111318' }}
            >
              {compressing ? 'Procesando…' : '📸 Tomar / Elegir foto'}
            </button>
            <button onClick={onClose}
              className="w-full py-3 font-mono text-sm text-gray-600">
              Omitir por ahora
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && previewUrl && (
        <div className="flex-1 flex flex-col">
          {/* Photo preview */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <img
              src={previewUrl}
              alt="Foto corporal"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {/* Date badge */}
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl font-mono text-xs"
              style={{ background: 'rgba(0,0,0,0.7)', color: accentColor }}>
              {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-6 space-y-3 bg-carbon">
            <p className="text-center text-gray-500 text-xs font-mono">
              Esta foto se guarda sólo en tu dispositivo
            </p>
            <button
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl font-display font-black uppercase text-lg active:scale-95 transition-transform"
              style={{ background: accentColor, color: '#111318' }}
            >
              ✓ Guardar como referencia
            </button>
            <button onClick={handleRetake}
              className="w-full py-3 rounded-2xl font-mono text-sm bg-gray-900 text-gray-400">
              Repetir foto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
