import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Splash() {
  const navigate = useNavigate()
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1400)
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
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(206,255,60,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Logo completo */}
      <div
        className="relative transition-all duration-700 px-8"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(12px)',
        }}
      >
        <img
          src="/logo-full.png"
          alt="Modo Máquina"
          className="w-64 h-auto drop-shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Tagline */}
      <p
        className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-gray-500 transition-all duration-500"
        style={{ opacity: phase >= 2 ? 1 : 0 }}
      >
        ACTIVA TU MEJOR VERSIÓN
      </p>

      {/* Loading dots */}
      <div
        className="mt-8 flex gap-2 transition-opacity duration-300"
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
