import { useState } from 'react'

interface Props {
  images: string[]   // [start, end]
  name: string
  accentColor: string
}

// Shows the two demo frames (inicio/fin). Hides gracefully if the image 404s.
export function ExerciseImage({ images, name, accentColor }: Props) {
  const [failed, setFailed] = useState<boolean[]>([false, false])
  const [loaded, setLoaded] = useState<boolean[]>([false, false])

  if (images.length === 0 || failed.every(Boolean)) return null

  return (
    <div className="flex gap-2 mb-2">
      {images.map((src, i) => failed[i] ? null : (
        <div key={i} className="relative flex-1 rounded-lg overflow-hidden" style={{ background:'#1C1F28', aspectRatio:'4/3' }}>
          {!loaded[i] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor:`${accentColor}33`, borderTopColor:accentColor }}/>
            </div>
          )}
          <img
            src={src}
            alt={`${name} ${i === 0 ? 'inicio' : 'fin'}`}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ opacity: loaded[i] ? 1 : 0, transition:'opacity 0.2s' }}
            onLoad={() => setLoaded(p => { const n=[...p]; n[i]=true; return n })}
            onError={() => setFailed(p => { const n=[...p]; n[i]=true; return n })}
          />
          <span className="absolute bottom-1 left-1 font-mono px-1.5 py-0.5 rounded"
            style={{ fontSize:'8px', background:'rgba(0,0,0,0.6)', color:accentColor }}>
            {i === 0 ? 'inicio' : 'fin'}
          </span>
        </div>
      ))}
    </div>
  )
}
