import { useEffect, useRef, useState } from 'react'

interface Props {
  accentColor: string
  onSave: (data: { audio?: string; text?: string }) => void
  onClose: () => void
  existing?: { audio?: string; text?: string; date?: string }
}

const MAX_SECONDS = 30

export function WhyRecorder({ accentColor, onSave, onClose, existing }: Props) {
  const [mode, setMode]         = useState<'audio' | 'text'>('audio')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds]   = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(existing?.audio || null)
  const [text, setText]         = useState(existing?.text || '')
  const [error, setError]       = useState('')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<Blob[]>([])
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stream.getTracks().forEach(t => t.stop())
  }, [])

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: pickMime() })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        const reader = new FileReader()
        reader.onload = () => setAudioUrl(reader.result as string)
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      recorderRef.current = mr
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_SECONDS) { stopRecording(); return MAX_SECONDS }
          return s + 1
        })
      }, 1000)
    } catch {
      setError('No se pudo acceder al micrófono. Revisa los permisos o escribe tu porqué.')
      setMode('text')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    recorderRef.current?.state === 'recording' && recorderRef.current.stop()
    setRecording(false)
  }

  const pickMime = () => {
    const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
    for (const o of opts) if (MediaRecorder.isTypeSupported(o)) return o
    return ''
  }

  const canSave = mode === 'audio' ? Boolean(audioUrl) : text.trim().length >= 10

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 65, background:'#111318' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
        <button onClick={onClose} className="text-gray-500 font-mono text-sm">← Después</button>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Tu porqué</p>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <h2 className="font-display font-black text-2xl text-white uppercase leading-tight mb-2">
          ¿Por qué empiezas hoy?
        </h2>
        <p className="text-gray-400 text-sm font-body leading-relaxed mb-6">
          Grábate 30 segundos diciendo por qué decidiste activar el modo máquina.
          Cuando quieras rendirte, te lo voy a recordar con tu propia voz.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background:'#1C1F28' }}>
          {([['audio','🎙️ Grabar'],['text','✍️ Escribir']] as const).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all"
              style={{ background: mode === m ? accentColor : 'transparent', color: mode === m ? '#111318' : '#666' }}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'audio' ? (
          <div className="flex flex-col items-center">
            {/* Record button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              className="rounded-full flex items-center justify-center active:scale-95 transition-transform mb-4"
              style={{
                width: 120, height: 120,
                background: recording ? '#E23A2E' : `${accentColor}18`,
                border: `3px solid ${recording ? '#E23A2E' : accentColor}`,
                boxShadow: recording ? '0 0 32px rgba(226,58,46,0.5)' : `0 0 24px ${accentColor}33`,
              }}>
              <span style={{ fontSize: 44 }}>{recording ? '⏹️' : '🎙️'}</span>
            </button>

            {recording ? (
              <>
                <p className="font-display font-black text-3xl" style={{ color:'#E23A2E' }}>
                  {String(seconds).padStart(2,'0')}s
                </p>
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden mt-2 mb-1">
                  <div className="h-full rounded-full transition-all"
                    style={{ width:`${(seconds/MAX_SECONDS)*100}%`, background:'#E23A2E' }} />
                </div>
                <p className="font-mono text-xs text-gray-500">Toca para detener · máx {MAX_SECONDS}s</p>
              </>
            ) : (
              <p className="font-mono text-xs text-gray-500 text-center">
                {audioUrl ? 'Grabado ✓ — toca para regrabar' : 'Toca para grabar'}
              </p>
            )}

            {audioUrl && !recording && (
              <div className="w-full mt-5 rounded-2xl p-4" style={{ background:'#1C1F28', border:`1px solid ${accentColor}33` }}>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Escúchate</p>
                <audio controls src={audioUrl} className="w-full" style={{ height: 40 }} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              maxLength={400}
              placeholder="Ej: Quiero llegar a los 40 con energía para jugar con mis hijos y sentirme fuerte otra vez."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-body text-sm placeholder-gray-600 focus:outline-none focus:border-volt transition-colors resize-none"
            />
            <p className="font-mono text-xs text-gray-600 mt-1 text-right">{text.length}/400</p>
          </div>
        )}

        {error && <p className="text-spartan text-xs font-mono mt-3 text-center">{error}</p>}
      </div>

      {/* Save */}
      <div className="px-6 pb-8 pt-2" style={{ paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <button
          disabled={!canSave}
          onClick={() => onSave(mode === 'audio' ? { audio: audioUrl! } : { text: text.trim() })}
          className="w-full py-4 rounded-2xl font-display font-black uppercase tracking-widest text-base disabled:opacity-40 active:scale-95 transition-transform"
          style={{ background: accentColor, color:'#111318' }}>
          Guardar mi porqué
        </button>
        <p className="text-gray-700 text-xs font-mono text-center mt-2">
          Es solo tuyo. Nunca se comparte.
        </p>
      </div>
    </div>
  )
}
