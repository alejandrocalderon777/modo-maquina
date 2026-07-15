import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { LINEAGES } from '../assets/data'
import type { Lineage } from '../types'
import clsx from 'clsx'
import { LineageEmblemSVG } from '../components/AvatarDisplay'

const LINEAGE_DETAIL: Record<Lineage, { description: string; culture: string; levelPreview: string }> = {
  spartan: {
    description: 'Disciplina de hierro. Los espartanos no negocian con la pereza. Tu coach será directo, exigente y sin excusas.',
    culture: 'Grecia Antigua · Esparta',
    levelPreview: 'Recluta → Hoplita → Espartano',
  },
  viking: {
    description: 'Fuerza y honor del norte. Cada entrenamiento es una ofrenda. Tu coach te desafía con ferocidad y respeto guerrero.',
    culture: 'Escandinavia · Era Vikinga',
    levelPreview: 'Karl → Berserker → Jarl',
  },
  mapuche: {
    description: 'El newen (fuerza interior) vive en ti. Conecta con la tierra y tu energía. Tu coach te guía con sabiduría y arraigo.',
    culture: 'Pueblo Mapuche · Chile y Argentina',
    levelPreview: 'Weche → Lonko → Toqui',
  },
}

export default function LineageSelect() {
  const navigate = useNavigate()
  const setProfile = useAppStore((s) => s.setProfile)
  const [selected, setSelected] = useState<Lineage | null>(null)

  const handleContinue = () => {
    if (!selected) return
    setProfile({ lineage: selected })
    navigate('/measurements')
  }

  const selectedConfig = LINEAGES.find((l) => l.id === selected)

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <p className="font-mono text-xs text-volt uppercase tracking-widest mb-1">Paso 3 de 3</p>
        <h1 className="font-display font-black text-4xl text-white uppercase leading-tight">
          ELIGE TU<br />LINAJE
        </h1>
        <p className="text-gray-500 text-sm font-body mt-2">
          Tu linaje tematiza toda tu experiencia: niveles, tono del coach, atuendos y desafíos.
        </p>
      </div>

      {/* Lineage cards */}
      <div className="px-4 space-y-3 flex-1 overflow-y-auto pb-4">
        {LINEAGES.map((lineage) => {
          const isSelected = selected === lineage.id
          const detail = LINEAGE_DETAIL[lineage.id]

          return (
            <button
              key={lineage.id}
              onClick={() => setSelected(lineage.id)}
              className="w-full text-left rounded-2xl border-2 overflow-hidden transition-all"
              style={{
                borderColor: isSelected ? lineage.color : '#252933',
                boxShadow: isSelected ? `0 0 25px ${lineage.color}33` : 'none',
              }}
            >
              {/* Top banner */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${lineage.color}22, ${lineage.color}08)`
                    : '#1C1F28',
                }}
              >
                <div
                    className="rounded-xl overflow-hidden flex-shrink-0"
                    style={{
                      width: 52, height: 52,
                      border: `2px solid ${lineage.color}55`,
                      boxShadow: isSelected ? `0 0 12px ${lineage.color}44` : 'none',
                    }}
                  >
                    <img
                      src={`/linaje-${lineage.id}.png`}
                      alt={lineage.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-display font-black text-xl uppercase"
                      style={{ color: isSelected ? lineage.color : '#fff' }}
                    >
                      {lineage.fullName}
                    </h3>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{ background: `${lineage.color}22`, color: lineage.color }}
                    >
                      GRATIS
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-mono">{detail.culture}</p>
                </div>
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: isSelected ? lineage.color : '#444',
                    background: isSelected ? lineage.color : 'transparent',
                  }}
                >
                  {isSelected && <span className="text-carbon text-xs font-black">✓</span>}
                </div>
              </div>

              {/* Description (show when selected) */}
              {isSelected && (
                <div className="px-4 pb-4 pt-2 animate-fade-in">
                  <p className="text-gray-300 text-sm font-body leading-relaxed">{detail.description}</p>
                  <div
                    className="mt-3 flex items-center gap-2 text-xs font-mono"
                    style={{ color: lineage.color }}
                  >
                    <span>📊</span>
                    <span>{detail.levelPreview}</span>
                  </div>
                  {/* Level preview pills */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {lineage.levels.slice(0, 4).map((lvl, i) => (
                      <span
                        key={lvl}
                        className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{
                          background: i === 0 ? `${lineage.color}33` : '#1C1F28',
                          color: i === 0 ? lineage.color : '#555',
                          border: `1px solid ${i === 0 ? lineage.color + '55' : '#333'}`,
                        }}
                      >
                        {i === 0 ? '▶ ' : ''}{lvl}
                      </span>
                    ))}
                    <span className="text-xs font-mono text-gray-600 px-2 py-0.5">+{lineage.levels.length - 4} más</span>
                  </div>
                </div>
              )}
            </button>
          )
        })}

        {/* Coming soon lineages */}
        <div className="rounded-2xl border-2 border-dashed border-gray-800 p-4 flex items-center gap-3 opacity-60">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-gray-500 font-display font-bold uppercase text-sm">Samurái · Azteca · Más</p>
            <p className="text-gray-700 text-xs font-mono">Próximamente en la tienda</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-10 pt-3">
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all disabled:opacity-30"
          style={{
            background: selectedConfig ? selectedConfig.color : '#333',
            color: '#111318',
            boxShadow: selectedConfig ? `0 0 20px ${selectedConfig.color}55` : 'none',
          }}
        >
          {selected
            ? `ACTIVAR LINAJE ${LINEAGES.find(l => l.id === selected)?.name.toUpperCase()}`
            : 'ELIGE TU LINAJE'}
        </button>
        {selected && (
          <p className="text-center text-xs text-gray-600 font-mono mt-2">
            Podrás cambiar o comprar otros linajes después
          </p>
        )}
      </div>
    </div>
  )
}
