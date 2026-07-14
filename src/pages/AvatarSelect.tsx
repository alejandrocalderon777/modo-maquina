import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { ARCHETYPES } from '../assets/data'
import type { Archetype } from '../types'
import clsx from 'clsx'

export default function AvatarSelect() {
  const navigate = useNavigate()
  const setProfile = useAppStore((s) => s.setProfile)
  const [selected, setSelected] = useState<Archetype | null>(null)

  const handleContinue = () => {
    if (!selected) return
    setProfile({ archetype: selected })
    navigate('/lineage-select')
  }

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      <div className="px-4 pt-12 pb-6">
        <p className="font-mono text-xs text-volt uppercase tracking-widest mb-1">Paso 2 de 3</p>
        <h1 className="font-display font-black text-4xl text-white uppercase leading-tight">
          ELIGE TU<br />AVATAR
        </h1>
        <p className="text-gray-500 text-sm font-body mt-2">
          Tu coach tendrá esta forma. Podrás cambiarla después.
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 grid grid-cols-2 gap-3">
        {ARCHETYPES.map((arch) => {
          const isSelected = selected === arch.id
          return (
            <button
              key={arch.id}
              onClick={() => setSelected(arch.id)}
              className={clsx(
                'relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all',
                isSelected
                  ? 'border-volt bg-volt/10'
                  : 'border-gray-800 bg-carbon-light hover:border-gray-600'
              )}
              style={isSelected ? { boxShadow: '0 0 20px rgba(206,255,60,0.2)' } : {}}
            >
              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-volt flex items-center justify-center">
                  <span className="text-carbon text-xs font-black">✓</span>
                </div>
              )}

              {/* Avatar illustration */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3"
                style={{
                  background: isSelected
                    ? 'radial-gradient(circle, rgba(206,255,60,0.2), rgba(206,255,60,0.05))'
                    : 'radial-gradient(circle, #1C1F28, #111318)',
                  border: `2px solid ${isSelected ? '#CEFF3C' : '#333'}`,
                }}
              >
                {arch.emoji}
              </div>

              <h3 className="font-display font-bold text-white text-lg uppercase">{arch.name}</h3>
              <p className="text-gray-500 text-xs text-center mt-1 font-body leading-tight">
                {arch.description}
              </p>

              {/* Traits */}
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {arch.traits.map((trait) => (
                  <span
                    key={trait}
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: isSelected ? 'rgba(206,255,60,0.15)' : '#1C1F28',
                      color: isSelected ? '#CEFF3C' : '#555',
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <div className="px-4 pb-10 pt-2">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all disabled:opacity-30"
          style={{
            background: selected ? '#CEFF3C' : '#333',
            color: '#111318',
            boxShadow: selected ? '0 0 20px rgba(206,255,60,0.4)' : 'none',
          }}
        >
          {selected ? `CONTINUAR CON ${ARCHETYPES.find(a => a.id === selected)?.name.toUpperCase()}` : 'ELIGE UN AVATAR'}
        </button>
      </div>
    </div>
  )
}
