import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, hydrateFromCloud } from '../store/useAppStore'
import { signUp, signIn } from '../lib/supabase'

type Mode = 'register' | 'login'

export default function Auth() {
  const navigate   = useNavigate()
  const setProfile = useAppStore((s) => s.setProfile)
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)

  const [mode, setMode]         = useState<Mode>('register')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const goNext = () => navigate(onboardingComplete ? '/dashboard' : '/onboarding')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !name.trim()) { setError('Ingresa tu nombre'); return }
    if (!email.trim() || !password) { setError('Completa email y contraseña'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setLoading(true)
    try {
      if (mode === 'register') {
        await signUp(email.trim(), password, name.trim())
        setProfile({ name: name.trim() })
        await hydrateFromCloud()
        goNext()
      } else {
        await signIn(email.trim(), password)
        await hydrateFromCloud()
        const done = useAppStore.getState().onboardingComplete
        navigate(done ? '/dashboard' : '/onboarding')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar'
      if (msg.includes('already registered')) setError('Ese email ya está registrado. Inicia sesión.')
      else if (msg.includes('Invalid login')) setError('Email o contraseña incorrectos.')
      else if (msg.includes('Email not confirmed')) setError('Revisa tu correo para confirmar la cuenta.')
      else setError(msg)
      setLoading(false)
    }
  }

  const handleGuest = () => {
    if (!name.trim()) { setError('Ingresa tu nombre para continuar como invitado'); return }
    setProfile({ name: name.trim() })
    goNext()
  }

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">

        <div className="mb-6">
          <img src="/logo-full.png" alt="Modo Máquina" className="w-52 h-auto drop-shadow-2xl"
            draggable={false} style={{ filter: 'drop-shadow(0 0 24px rgba(201,162,39,0.35))' }} />
        </div>

        <div className="text-center mb-6">
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-wide mb-1">
            {mode === 'register' ? 'Comienza aquí' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-gray-500 text-sm font-body">
            {mode === 'register' ? 'Tu modo máquina empieza hoy' : 'Retoma tu progreso'}
          </p>
        </div>

        <div className="w-full max-w-sm flex gap-2 mb-5 p-1 rounded-xl" style={{ background:'#1C1F28' }}>
          {(['register','login'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
              className="flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all"
              style={{ background: mode === m ? '#CEFF3C' : 'transparent', color: mode === m ? '#111318' : '#666' }}>
              {m === 'register' ? 'Crear cuenta' : 'Ingresar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">¿Cómo te llamas?</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoFocus
                className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3.5 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors" />
            </div>
          )}

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email"
              className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3.5 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors" />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3.5 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors" />
          </div>

          {error && <p className="text-spartan text-xs font-mono text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all disabled:opacity-50 mt-1"
            style={{ background: loading ? '#333' : '#CEFF3C', color: '#111318', boxShadow: loading ? 'none' : '0 0 20px rgba(206,255,60,0.4)' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
                {mode === 'register' ? 'Creando...' : 'Ingresando...'}
              </span>
            ) : (mode === 'register' ? 'ACTIVAR MODO MÁQUINA' : 'INGRESAR')}
          </button>
        </form>

        <div className="w-full max-w-sm flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-xs font-mono">O</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <button type="button" onClick={handleGuest}
          className="w-full max-w-sm py-3.5 rounded-xl border border-gray-700 text-white font-body flex items-center justify-center gap-3 hover:border-gray-500 transition-colors">
          Continuar como invitado
        </button>
        <p className="text-gray-700 text-xs font-mono mt-2 text-center max-w-sm">
          Como invitado tus datos solo se guardan en este dispositivo
        </p>
      </div>

      <p className="text-center text-xs text-gray-700 font-mono pb-6 px-6">
        Con cuenta, tus datos se respaldan de forma segura y privada en la nube.
        Esta app orienta hábitos saludables y no reemplaza a profesionales de la salud.
      </p>
    </div>
  )
}
