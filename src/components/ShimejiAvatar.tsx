import { useEffect, useRef, useState } from 'react'

interface Props {
  avatarSrc: string
  accentColor: string
  phrases: string[]
}

type State = 'walk' | 'idle' | 'sit'

export function ShimejiAvatar({ avatarSrc, accentColor, phrases }: Props) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const imgRef    = useRef<HTMLDivElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [bubble, setBubble] = useState<string | null>(null)

  useEffect(() => {
    const SPEED    = 1.0          // px / frame
    const SIZE     = 56           // avatar px
    const BOTTOM   = 76           // above nav bar
    let x          = Math.random() * (window.innerWidth - SIZE - 20) + 10
    let dir        = Math.random() > 0.5 ? 1 : -1
    let state: State = 'walk'
    let stateMs    = 0
    let nextChange = 2500 + Math.random() * 3500
    let lastTs     = 0
    let raf        = 0
    let bobPhase   = 0

    const setTransform = () => {
      if (!wrapRef.current) return
      wrapRef.current.style.left      = `${x}px`
      wrapRef.current.style.transform = `scaleX(${dir})`
    }

    const tick = (ts: number) => {
      const dt = Math.min(ts - lastTs, 32) // cap at 32ms
      lastTs = ts
      stateMs += dt

      const W = window.innerWidth

      if (state === 'walk') {
        x += SPEED * dir
        if (x > W - SIZE - 10) { dir = -1; x = W - SIZE - 10 }
        if (x < 10)            { dir =  1; x = 10 }
        // bob up/down
        bobPhase += dt * 0.012
        if (imgRef.current) {
          imgRef.current.style.transform = `translateY(${Math.sin(bobPhase) * 3}px)`
        }
      } else {
        if (imgRef.current) imgRef.current.style.transform = 'translateY(0px)'
      }

      setTransform()

      if (stateMs > nextChange) {
        stateMs    = 0
        nextChange = 2000 + Math.random() * 5000
        if (state === 'walk') {
          state = Math.random() > 0.4 ? 'idle' : 'sit'
        } else {
          state = 'walk'
          dir   = Math.random() > 0.5 ? 1 : -1
        }
        // apply sit squish
        if (imgRef.current) {
          imgRef.current.style.transform = state === 'sit'
            ? 'translateY(6px) scaleY(0.85)'
            : 'translateY(0px)'
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame((ts) => { lastTs = ts; raf = requestAnimationFrame(tick) })
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleTap = () => {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)]
    setBubble(phrase)
    setTimeout(() => setBubble(null), 2200)
  }

  return (
    <div
      ref={wrapRef}
      onClick={handleTap}
      style={{
        position:  'fixed',
        bottom:    76,
        left:      80,
        width:     56,
        height:    56,
        zIndex:    44,
        cursor:    'pointer',
        transformOrigin: 'center bottom',
      }}
    >
      {/* Speech bubble */}
      {bubble && (
        <div
          ref={bubbleRef}
          style={{
            position:   'absolute',
            bottom:     '110%',
            left:       '50%',
            transform:  'translateX(-50%)',
            background: accentColor,
            color:      '#111318',
            borderRadius: 10,
            padding:    '5px 10px',
            fontSize:   11,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow:  `0 2px 12px ${accentColor}66`,
            animation:  'shimeji-bubble 0.2s ease-out',
          }}
        >
          {bubble}
          {/* tail */}
          <span style={{
            position:   'absolute',
            bottom:     -6,
            left:       '50%',
            transform:  'translateX(-50%)',
            width:      0,
            height:     0,
            borderLeft: '6px solid transparent',
            borderRight:'6px solid transparent',
            borderTop:  `6px solid ${accentColor}`,
            display:    'block',
          }} />
        </div>
      )}

      {/* Avatar image */}
      <div
        ref={imgRef}
        style={{ width: 56, height: 56, transition: 'transform 0.2s ease' }}
      >
        <img
          src={avatarSrc}
          alt="shimeji"
          style={{
            width:        56,
            height:       56,
            borderRadius: '50%',
            border:       `2px solid ${accentColor}`,
            boxShadow:    `0 2px 12px ${accentColor}44`,
            objectFit:    'cover',
            display:      'block',
            userSelect:   'none',
            pointerEvents:'none',
          }}
        />
      </div>
    </div>
  )
}
