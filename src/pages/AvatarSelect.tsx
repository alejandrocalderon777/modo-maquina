import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { ARCHETYPES } from '../assets/data'
import { RunnerSVG, BuilderSVG, FitnessSVG, WarriorSVG, ARCHETYPE_COLOR } from '../components/AvatarDisplay'
import type { Archetype } from '../types'
import clsx from 'clsx'

const ARCHETYPE_CHARS: Record<string, { label: string; subtitle: string }> = {
  runner: { label: 'Prototipo Keniano', subtitle: 'Delgado, explosivo, élite' },
  builder: { label: 'Estilo Arnold', subtitle: 'Masa extrema, poder puro' },
  fitness: { label: 'Atleta Total', subtitle: 'Curvas, músculo y definición' },
  warrior: { label: 'Guerrero Espartano', subtitle: 'Armado, implacable, élite' },
}

function ArchetypeAvatar({ archetype, size }: { archetype: string; size: number }) {
  if (archetype === 'runner') return <RunnerSVG size={size} />
  if (archetype === 'builder') return <BuilderSVG size={size} />
  if (archetype === 'fitness') return <FitnessSVG size={size} />
  return <WarriorSVG size={size} />
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
          const charInfo = ARCHETYPE_CHARS[arch.id]

          return (
            <button
              key={arch.id}
              onClick={() => setSelected(arch.id as Archetype)}
              className={clsx(
                'relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all',
                isSelected ? 'bg-opacity-10' : 'border-gray-800 bg-carbon-light hover:border-gray-600'
              )}
              style={{
                borderColor: isSelected ? accentColor : undefined,
                background: isSelected ? `linear-gradient(135deg, ${accentColor}18, ${accentColor}06)` : undefined,
                boxShadow: isSelected ? `0 0 24px ${accentColor}30` : undefined,
              }}
            >
              {/* Selected check */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: accentColor }}
                >
                  <span className="text-carbon text-xs font-black">✓</span>
                </div>
              )}

              {/* Character illustration */}
              <div
                className="rounded-xl overflow-hidden mb-3 transition-all"
                style={{
                  width: 84,
                  height: 84,
                  border: `2px solid ${isSelected ? accentColor : '#2A2D38'}`,
                  boxShadow: isSelected ? `0 0 20px ${accentColor}55` : 'none',
                }}
              >
                <ArchetypeAvatar archetype={arch.id} size={84} />
              </div>

              <h3
                className="font-display font-bold text-lg uppercase"
                style={{ color: isSelected ? accentColor : 'white' }}
              >
                {arch.name}
              </h3>
              <p className="text-gray-500 text-xs text-center font-mono mt-0.5">
                {charInfo.label}
              </p>
              <p className="text-gray-600 text-xs text-center font-body mt-1 leading-tight">
                {charInfo.subtitle}
              </p>

              {/* Traits */}
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {arch.traits.map((trait) => (
                  <span
                    key={trait}
                    className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{
                      background: isSelected ? `${accentColor}22` : '#1C1F28',
                      color: isSelected ? accentColor : '#555',
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
