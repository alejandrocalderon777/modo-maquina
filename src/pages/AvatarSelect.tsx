import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { ARCHETYPES } from '../assets/data'
import { ARCHETYPE_COLOR } from '../components/AvatarDisplay'
import type { Archetype } from '../types'
import clsx from 'clsx'

const ARCHETYPE_IMAGE: Record<string, string> = {
  runner:  '/avatar-runner.png',
  builder: '/avatar-builder.png',
  fitness: '/avatar-fitness.png',
  warrior: '/avatar-warrior.png',
}

const ARCHETYPE_SUBTITLE: Record<string, string> = {
  runner:  'Prototipo Keniano',
  builder: 'Estilo Arnold',
  fitness: 'Atleta Total',
  warrior: 'Guerrero Espartano',
}

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
      <div className="px-4 pt-12 pb-4">
        <p className="font-mono text-xs text-volt uppercase tracking-widest mb-1">Paso 2 de 3</p>
        <h1 className="font-display font-black text-4xl text-white uppercase leading-tight">
          ELIGE TU<br />AVATAR
        </h1>
        <p className="text-gray-500 text-sm font-body mt-2">
          Tu coach tomará esta forma. Rasgos exagerados. Carácter único.
        </p>
      </div>

      <div className="flex-1 px-4 pb-4 grid grid-cols-2 gap-3">
        {ARCHETYPES.map((arch) => {
          const isSelected = selected === arch.id
          const accentColor = ARCHETYPE_COLOR[arch.id as Archetype]

          return (
            <button
              key={arch.id}
              onClick={() => setSelected(arch.id as Archetype)}
              className={clsx(
                'relative flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all',
                !isSelected && 'border-gray-800 bg-carbon-light hover:border-gray-600'
              )}
              style={{
                borderColor: isSelected ? accentColor : undefined,
                background: isSelected
                  ? `linear-gradient(180deg, ${accentColor}18 0%, ${accentColor}06 100%)`
                  : undefined,
                boxShadow: isSelected ? `0 0 24px ${accentColor}35` : undefined,
              }}
            >
              {/* Selected check */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: accentColor }}
                >
                  <span className="text-carbon text-xs font-black">✓</span>
                </div>
              )}

              {/* Avatar photo */}
              <div className="w-full aspect-square overflow-hidden">
                <img
                  src={ARCHETYPE_IMAGE[arch.id]}
                  alt={arch.name}
                  className="w-full h-full object-cover transition-transform duration-300"
                  style={{ transform: isSelected ? 'scale(1.05)' : 'scale(1)' }}
                />
              </div>

              {/* Info */}
              <div className="w-full px-3 py-3">
                <h3
                  className="font-display font-bold text-base uppercase"
                  style={{ color: isSelected ? accentColor : 'white' }}
                >
                  {arch.name}
                </h3>
                <p className="text-gray-500 text-xs font-mono">
                  {ARCHETYPE_SUBTITLE[arch.id]}
                </p>
                {/* Traits */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {arch.traits.map((trait) => (
                    <span
                      key={trait}
                      className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isSelected ? `${accentColor}22` : '#1C1F28',
                        color: isSelected ? accentColor : '#555',
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
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
            background: selected ? ARCHETYPE_COLOR[selected] : '#333',
            color: '#111318',
            boxShadow: selected ? `0 0 20px ${ARCHETYPE_COLOR[selected]}55` : 'none',
          }}
        >
          {selected
            ? `CONTINUAR CON ${ARCHETYPES.find((a) => a.id === selected)?.name.toUpperCase()}`
            : 'ELIGE UN AVATAR'}
        </button>
      </div>
    </div>
  )
}
