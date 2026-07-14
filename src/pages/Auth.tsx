import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Auth() {
  const navigate = useNavigate()
  const setProfile = useAppStore((s) => s.setProfile)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() && mode === 'register') return
    setLoading(true)
    setProfile({ name: name.trim() })
    setTimeout(() => navigate('/onboarding'), 800)
  }

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo small */}
        <div className="mb-8">
          <svg width="60" height="60" viewBox="0 0 120 120" fill="none">
            <path
              d="M 60 20 A 44 44 0 1 1 59.9 20"
              stroke="#CEFF3C"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="230 50"
            />
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

        <h1 className="font-display font-black text-4xl text-white uppercase tracking-wide mb-1">
          {mode === 'register' ? 'Comienza aquí' : 'Bienvenido de vuelta'}
        </h1>
        <p className="text-gray-500 text-sm font-body mb-8">
          {mode === 'register' ? 'Tu modo máquina empieza hoy' : 'El modo máquina te espera'}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">
                ¿Cómo te llamas?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3.5 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3.5 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors"
            />
          </div>

          {mode === 'login' && (
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3.5 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all disabled:opacity-50 mt-2"
            style={{
              background: loading ? '#333' : '#CEFF3C',
              color: '#111318',
              boxShadow: loading ? 'none' : '0 0 20px rgba(206,255,60,0.4)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
                Activando...
              </span>
            ) : mode === 'register' ? (
              'ACTIVAR MODO MÁQUINA'
            ) : (
              'ENTRAR'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-xs font-mono">O</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Google */}
        <button
          onClick={() => { setLoading(true); setTimeout(() => navigate('/onboarding'), 800) }}
          className="w-full max-w-sm py-3.5 rounded-xl border border-gray-700 text-white font-body flex items-center justify-center gap-3 hover:border-gray-500 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="mt-6 text-gray-600 text-sm font-body">
          {mode === 'register' ? '¿Ya tienes cuenta?' : '¿Eres nuevo?'}{' '}
          <button
            className="text-volt underline"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? 'Iniciar sesión' : 'Regístrate'}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-700 font-mono pb-6 px-6">
        Al registrarte aceptas nuestros Términos. Esta app orienta hábitos saludables y no reemplaza a profesionales de la salud.
      </p>
    </div>
  )
}
