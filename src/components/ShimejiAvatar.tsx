import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  archetype: string   // runner | builder | fitness | warrior
  accentColor: string // lineage color
  phrases: string[]
}

// Body params per archetype
const BODY: Record<string, {
  torsoW: number; torsoH: number
  armW: number;   legW: number; legH: number
  speed: number;  skinTone: string
  hairColor: string; shirtColor: string; pantColor: string
}> = {
  runner:  { torsoW:.42, torsoH:1.5, armW:.14, legW:.20, legH:1.35, speed:1.6, skinTone:'#C8A27A', hairColor:'#1a1212', shirtColor:'#1a3a1a', pantColor:'#1a2030' },
  builder: { torsoW:.66, torsoH:1.7, armW:.24, legW:.30, legH:1.25, speed:0.9, skinTone:'#C09060', hairColor:'#111',    shirtColor:'#2a1010', pantColor:'#1a1a2a' },
  fitness: { torsoW:.52, torsoH:1.6, armW:.17, legW:.23, legH:1.30, speed:1.2, skinTone:'#D4A882', hairColor:'#2a1a0a', shirtColor:'#102030', pantColor:'#1e1e1e' },
  warrior: { torsoW:.58, torsoH:1.65, armW:.21, legW:.27, legH:1.28, speed:1.1, skinTone:'#B8926A', hairColor:'#0a0a0a', shirtColor:'#1a1a2a', pantColor:'#1a1010' },
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  pose: Record<string, number>,
  params: typeof BODY[string],
  accentColor: string,
  facing: 1 | -1
) {
  const U = 13
  const { headY=0, bodyLean=0, lArmA=0, rArmA=0, lForeA=0, rForeA=0,
          lLegA=0, rLegA=0, lCalfA=0, rCalfA=0, squash=1 } = pose
  const { torsoW, torsoH, armW, legW, legH, skinTone, hairColor, shirtColor, pantColor } = params

  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(facing, 1)

  // shadow
  ctx.beginPath()
  ctx.ellipse(0, U*4.5, U*1.0, U*0.2, 0, 0, Math.PI*2)
  ctx.fillStyle = accentColor + '18'
  ctx.fill()

  // ── LEGS ──
  function drawLeg(side: number, thighA: number, calfA: number) {
    ctx.save()
    ctx.translate(side * U * torsoW * 0.45, U * 1.55)
    ctx.rotate(thighA)
    ctx.beginPath()
    ctx.roundRect(-U*legW, 0, U*legW*2, U*legH, 3)
    ctx.fillStyle = pantColor
    ctx.fill()
    ctx.translate(0, U*legH)
    ctx.rotate(calfA)
    ctx.beginPath()
    ctx.roundRect(-U*legW*.85, 0, U*legW*1.7, U*legH*.95, 3)
    ctx.fillStyle = pantColor
    ctx.fill()
    // shoe
    ctx.beginPath()
    ctx.ellipse(U*.08, U*legH*.95, U*legW*1.4, U*0.18, 0, 0, Math.PI*2)
    ctx.fillStyle = accentColor
    ctx.fill()
    ctx.restore()
  }
  drawLeg(-1, lLegA, lCalfA)
  drawLeg( 1, rLegA, rCalfA)

  // ── TORSO ──
  ctx.save()
  ctx.rotate(bodyLean)
  ctx.beginPath()
  ctx.roundRect(-U*torsoW, -U*.05, U*torsoW*2, U*torsoH*squash, [5,5,8,8])
  ctx.fillStyle = shirtColor
  ctx.fill()
  // chest stripe
  ctx.beginPath()
  ctx.roundRect(-U*.07, -U*.02, U*.14, U*torsoH*squash*.9, 2)
  ctx.fillStyle = accentColor + '55'
  ctx.fill()

  // ── ARMS ──
  function drawArm(side: number, shoulderA: number, elbowA: number) {
    ctx.save()
    ctx.translate(side * U*(torsoW+.06), U*.05)
    ctx.rotate(shoulderA)
    ctx.beginPath()
    ctx.roundRect(-U*armW, 0, U*armW*2, U*1.0, 4)
    ctx.fillStyle = shirtColor
    ctx.fill()
    ctx.translate(0, U*1.0)
    ctx.rotate(elbowA)
    ctx.beginPath()
    ctx.roundRect(-U*armW*.85, 0, U*armW*1.7, U*.85, 3)
    ctx.fillStyle = skinTone
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, U*.85, U*armW*.85, 0, Math.PI*2)
    ctx.fillStyle = skinTone
    ctx.fill()
    ctx.restore()
  }
  drawArm(-1, lArmA, lForeA)
  drawArm( 1, rArmA, rForeA)
  ctx.restore()

  // ── HEAD ──
  ctx.save()
  ctx.translate(0, -U*.5 + headY)
  // neck
  ctx.beginPath()
  ctx.roundRect(-U*.15, 0, U*.3, U*.38, 2)
  ctx.fillStyle = skinTone
  ctx.fill()
  // head shape
  ctx.beginPath()
  ctx.ellipse(0, -U*.35, U*.52, U*.6, 0, 0, Math.PI*2)
  ctx.fillStyle = skinTone
  ctx.fill()
  // hair
  ctx.beginPath()
  ctx.ellipse(0, -U*.62, U*.50, U*.28, 0, 0, Math.PI*2)
  ctx.fillStyle = hairColor
  ctx.fill()
  // ear
  ctx.beginPath()
  ctx.arc(U*.51, -U*.35, U*.12, 0, Math.PI*2)
  ctx.fillStyle = skinTone
  ctx.fill()
  // eye
  ctx.beginPath()
  ctx.arc(U*.16, -U*.35, U*.09, 0, Math.PI*2)
  ctx.fillStyle = '#222'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(U*.19, -U*.38, U*.04, 0, Math.PI*2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  // sweatband accent
  ctx.beginPath()
  ctx.arc(0, -U*.35, U*.48, Math.PI*.85, Math.PI*2.15)
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  ctx.restore()
}

type AnimState = 'walk' | 'idle' | 'sit'

function getPose(state: AnimState, t: number): Record<string, number> {
  const s = Math.sin
  switch (state) {
    case 'walk': {
      const sp = t * 5.5
      return {
        headY:   s(sp*2)*1.5,
        lLegA:   s(sp)*.38,    rLegA:  s(sp+Math.PI)*.38,
        lCalfA:  Math.max(0, s(sp+.6)*.55),
        rCalfA:  Math.max(0, s(sp+.6+Math.PI)*.55),
        lArmA:   s(sp+Math.PI)*.32, rArmA: s(sp)*.32,
        lForeA:  .12, rForeA: .12,
      }
    }
    case 'idle': {
      const sp = t * 1.5
      return {
        headY: s(sp)*1.0,
        lArmA: .08+s(sp*.7)*.04, rArmA: .08+s(sp*.7+1)*.04,
        lForeA: .08, rForeA: .08,
        lLegA: .03, rLegA: -.03,
        lCalfA: .04, rCalfA: .04,
      }
    }
    case 'sit': {
      const depth = .85
      return {
        squash: 1-depth*.18,
        headY: depth*10,
        lLegA: depth*.45,  rLegA: -depth*.45,
        lCalfA: -depth*.9, rCalfA: -depth*.9,
        lArmA: .1, rArmA: .1,
        lForeA: .1, rForeA: .1,
      }
    }
  }
}

export function ShimejiAvatar({ archetype, accentColor, phrases }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const stateRef   = useRef<{ x:number; dir:1|-1; state:AnimState; stateMs:number; nextChange:number }>({
    x: 80, dir: 1, state: 'walk', stateMs: 0, nextChange: 3000,
  })
  const [bubble, setBubble] = useState<string|null>(null)

  const params = BODY[archetype] || BODY.fitness

  // Draw loop — no React state, direct DOM
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 80, H = 120
    canvas.width  = W
    canvas.height = H
    let raf = 0, lastTs = 0

    const tick = (ts: number) => {
      const dt = Math.min(ts - lastTs, 32)
      lastTs = ts
      const t = ts / 1000
      const r = stateRef.current

      r.stateMs += dt
      if (r.stateMs > r.nextChange) {
        r.stateMs = 0
        r.nextChange = 2000 + Math.random()*5000
        if (r.state === 'walk') r.state = Math.random() > .35 ? 'idle' : 'sit'
        else { r.state = 'walk'; r.dir = Math.random() > .5 ? 1 : -1 }
      }

      const sw = window.innerWidth
      if (r.state === 'walk') {
        r.x += r.dir * params.speed
        if (r.x > sw - 90) { r.dir = -1; r.x = sw - 90 }
        if (r.x < 10)       { r.dir =  1; r.x = 10 }
      }

      // move wrapper
      if (wrapRef.current) {
        wrapRef.current.style.left = `${r.x}px`
        wrapRef.current.style.transform = `scaleX(${r.dir})`
      }

      // draw
      ctx.clearRect(0, 0, W, H)
      const pose = getPose(r.state, t)
      drawCharacter(ctx, W/2, H - 8, pose, params, accentColor, 1)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame((ts) => { lastTs = ts; raf = requestAnimationFrame(tick) })
    return () => cancelAnimationFrame(raf)
  }, [archetype, accentColor])

  const handleTap = useCallback(() => {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)]
    setBubble(phrase)
    setTimeout(() => setBubble(null), 2200)
  }, [phrases])

  return (
    <div ref={wrapRef} onClick={handleTap} style={{
      position: 'fixed', bottom: 70, left: 80,
      width: 80, height: 120,
      zIndex: 44, cursor: 'pointer',
      transformOrigin: 'center bottom',
    }}>
      {bubble && (
        <div style={{
          position: 'absolute', bottom: '108%', left: '50%',
          transform: 'translateX(-50%)',
          background: accentColor, color: '#111318',
          borderRadius: 10, padding: '5px 10px',
          fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 'bold', whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: 'shimeji-bubble .18s ease-out',
        }}>
          {bubble}
          <span style={{
            position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)',
            borderLeft:'6px solid transparent', borderRight:'6px solid transparent',
            borderTop:`6px solid ${accentColor}`, display:'block', width:0, height:0,
          }}/>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display:'block', userSelect:'none', pointerEvents:'none' }} />
    </div>
  )
}
