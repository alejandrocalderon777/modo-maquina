import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Splash() {
  const navigate = useNavigate()
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Phase 0: logo appears
    const t1 = setTimeout(() => setPhase(1), 600)
    // Phase 1: tagline appears
    const t2 = setTimeout(() => setPhase(2), 1500)
    // Phase 2: redirect
    const t3 = setTimeout(() => {
      if (onboardingComplete) {
        navigate('/dashboard')
      } else {
        navigate('/auth')
      }
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [navigate, onboardingComplete])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-carbon relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#CEFF3C 1px, transparent 1px), linear-gradient(90deg, #CEFF3C 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow backdrop */}
      <div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(206,255,60,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <div
        className="relative transition-all duration-700"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.7)',
        }}
      >
        {/* Power symbol SVG */}
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          {/* Outer ring (open at top) */}
          <path
            d="M 60 20 A 44 44 0 1 1 59.9 20"
            stroke="#CEFF3C"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="230 50"
          />
          {/* M shape emerging from ring */}
          <path
            d="M 35 80 L 35 45 L 60 68 L 85 45 L 85 80"
            stroke="#CEFF3C"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* App name */}
      <div
        className="mt-6 transition-all duration-500"
        style={{ opacity: phase >= 1 ? 1 : 0 }}
      >
        <h1
          className="font-display font-black text-5xl tracking-widest uppercase text-volt volt-text-glow"
        >
          MODO
        </h1>
        <h1
          className="font-display font-black text-5xl tracking-widest uppercase text-volt volt-text-glow -mt-2"
        >
          MÁQUINA
        </h1>
      </div>

      {/* Tagline */}
      <p
        className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-gray-500 transition-all duration-500"
        style={{ opacity: phase >= 2 ? 1 : 0 }}
      >
        ACTIVA TU MEJOR VERSIÓN
      </p>

      {/* Loading dots */}
      <div
        className="mt-12 flex gap-2 transition-opacity duration-300"
        style={{ opacity: phase >= 2 ? 1 : 0 }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
