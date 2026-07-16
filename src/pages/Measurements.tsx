import { useState } from 'react'
import BodyScan from '../components/BodyScan'
import { calculateMacros, GOAL_LABELS } from '../utils/macros'
import { useAppStore } from '../store/useAppStore'
import type { BodyPhoto } from '../types'
import { useNavigate } from 'react-router-dom'
import { LINEAGES } from '../assets/data'
import type { Measurements } from '../types'

export default function MeasurementsPage() {
  const navigate = useNavigate()
  const setMeasurements = useAppStore((s) => s.setMeasurements)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const profile = useAppStore((s) => s.profile)

  const lineage = LINEAGES.find((l) => l.id === profile.lineage)
  const accentColor = lineage?.color || '#CEFF3C'

  const [data, setData] = useState<Partial<Measurements>>({})
  const [section, setSection] = useState<'basic' | 'goals' | 'body'>('basic')
  const [showBodyScan, setShowBodyScan] = useState(false)
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null)
  const addBodyPhoto = useAppStore((s) => s.addBodyPhoto)
  const setMacroTargets = useAppStore((s) => s.setMacroTargets)

  const set = (field: keyof Measurements, val: string) => {
    const num = parseFloat(val)
    if (!isNaN(num)) setData((prev) => ({ ...prev, [field]: num }))
    else setData((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleContinue = () => {
    if (section === 'basic') {
      setSection('goals')
      return
    }
    if (section === 'goals') {
      // Save calculated macros
      if (data.weight && data.height) {
        const result = calculateMacros({
          weight: data.weight,
          height: data.height,
          age: data.age,
          sex: profile.sex,
          goal: profile.goal as string,
          level: profile.level as string,
        })
        setMacroTargets({ calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat })
      }
      setSection('body')
      return
    }
    setMeasurements(data)
    completeOnboarding()
    navigate('/dashboard')
  }

  const handleBodyPhoto = (dataUrl: string) => {
    setSavedPhoto(dataUrl)
    setShowBodyScan(false)
    const photo: BodyPhoto = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      dataUrl,
    }
    addBodyPhoto(photo)
  }

  const canContinueBasic = data.weight && data.height
  const macroPreview = (data.weight && data.height) ? calculateMacros({ weight: data.weight, height: data.height, age: data.age, sex: profile.sex, goal: profile.goal as string, level: profile.level as string }) : null
  const canFinish = true // body measurements are optional

  const inputClass =
    'w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-700 focus:outline-none focus:ring-1 transition-colors text-base'

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {showBodyScan && (
        <BodyScan
          onPhoto={handleBodyPhoto}
          onClose={() => setShowBodyScan(false)}
          accentColor={accentColor}
        />
      )}
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: accentColor }}>
          Evaluación inicial
        </p>
        <h1 className="font-display font-black text-4xl text-white uppercase leading-tight">
          {section === 'basic' ? 'DATOS\nBÁSICOS' : section === 'goals' ? 'TU PLAN\nPERSONAL' : 'MEDIDAS\nCORPORALES'}
        </h1>
        <p className="text-gray-500 text-sm font-body mt-2">
          {section === 'basic'
            ? 'Nos sirven como punto de partida para tu plan.'
            : section === 'goals'
            ? 'Basado en tu objetivo y nivel, calculamos tus macros diarios exactos.'
            : 'Opcionales pero muy útiles para trackear tu progreso real.'}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="px-4 pb-4 flex gap-2">
        {['Básico', 'Objetivos', 'Medidas'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
              style={{
                background:
                  (i === 0 && section === 'basic') || (i === 1 && section === 'goals') || (i === 2 && section === 'body')
                    ? accentColor
                    : ((i === 0 && (section === 'goals' || section === 'body')) || (i === 1 && section === 'body'))
                    ? '#333'
                    : '#1C1F28',
                color: ((i === 0 && (section === 'goals' || section === 'body')) || (i === 1 && section === 'body')) ? '#666' : '#111318',
              }}
            >
              {(i === 0 && (section === 'goals' || section === 'body')) || (i === 1 && section === 'body') ? '✓' : i + 1}
            </div>
            <span className="text-xs font-mono text-gray-500">{s}</span>
            {i < 2 && <span className="text-gray-700 mx-1">›</span>}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {section === 'basic' ? (
          <>
            <Field label="Peso actual" unit="kg" placeholder="75" onValue={(v) => set('weight', v)} />
            <Field label="Estatura" unit="cm" placeholder="175" onValue={(v) => set('height', v)} />
            <Field label="Edad" unit="años" placeholder="30" onValue={(v) => { const n = parseFloat(v); if (!isNaN(n)) setData(p => ({ ...p, age: n })) }} />
            {data.weight && data.height && (
              <div
                className="rounded-xl p-4 animate-fade-in"
                style={{ background: `${accentColor}11`, border: `1px solid ${accentColor}33` }}
              >
                <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: accentColor }}>
                  Tu IMC
                </p>
                <p className="font-display font-black text-3xl text-white">
                  {(data.weight / ((data.height / 100) ** 2)).toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs font-body mt-1">
                  {(() => {
                    const bmi = data.weight! / ((data.height! / 100) ** 2)
                    if (bmi < 18.5) return 'Bajo peso'
                    if (bmi < 25) return 'Peso normal ✓'
                    if (bmi < 30) return 'Sobrepeso'
                    return 'Obesidad'
                  })()}
                  {' · '}Referencia orientativa, no diagnóstico clínico.
                </p>
              </div>
            )}
          </>
        ) : section === 'goals' ? (
          <>
            {/* Goal summary */}
            {profile.goal && GOAL_LABELS[profile.goal as string] && (
              <div className="rounded-2xl p-4 mb-2" style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30` }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{GOAL_LABELS[profile.goal as string].emoji}</span>
                  <div>
                    <p className="font-display font-black text-white text-lg">{GOAL_LABELS[profile.goal as string].label}</p>
                    <p className="text-xs font-mono" style={{ color: accentColor }}>{GOAL_LABELS[profile.goal as string].desc}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Calculated macros */}
            {macroPreview && (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1C1F28' }}>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Tu ingesta diaria recomendada</p>

                {/* Calories */}
                <div className="flex items-center justify-between py-3 border-b border-gray-800">
                  <div>
                    <p className="text-white font-display font-bold text-base">Calorías totales</p>
                    <p className="text-gray-500 text-xs font-mono">TDEE: {macroPreview.tdee} kcal{macroPreview.deficit !== 0 ? ` · ${macroPreview.deficit > 0 ? '+' : ''}${Math.round(macroPreview.deficit * 100)}%` : ''}</p>
                  </div>
                  <p className="font-display font-black text-3xl" style={{ color: accentColor }}>{macroPreview.calories}</p>
                </div>

                {/* Macros grid */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {[
                    { label: 'Proteína', value: macroPreview.protein, unit: 'g', color: '#E23A2E', tip: `${Math.round(macroPreview.protein / (data.weight ?? 1) * 10) / 10}g/kg` },
                    { label: 'Carbohidratos', value: macroPreview.carbs, unit: 'g', color: '#6FD3E8', tip: `${Math.round(macroPreview.carbs * 4 / macroPreview.calories * 100)}% kcal` },
                    { label: 'Grasas', value: macroPreview.fat, unit: 'g', color: '#DE782C', tip: `${Math.round(macroPreview.fat * 9 / macroPreview.calories * 100)}% kcal` },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: `${m.color}10`, border: `1px solid ${m.color}25` }}>
                      <p className="font-display font-black text-2xl" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-white text-xs font-mono">{m.unit}</p>
                      <p className="text-gray-600 text-xs font-mono mt-0.5">{m.label}</p>
                      <p className="text-xs font-mono mt-1" style={{ color: m.color, opacity: 0.7 }}>{m.tip}</p>
                    </div>
                  ))}
                </div>

                <p className="text-gray-600 text-xs font-body pt-1">
                  Estos valores se ajustan automáticamente a tu progreso. Puedes modificarlos en cualquier momento desde tu perfil.
                </p>
              </div>
            )}

            {/* Exercise target */}
            <div className="rounded-2xl p-4" style={{ background: '#1C1F28' }}>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Ejercicio semanal</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: `${accentColor}15` }}>🏋️</div>
                <div>
                  <p className="text-white font-display font-bold text-base">{profile.daysPerWeek ?? '3'} días por semana</p>
                  <p className="text-gray-500 text-xs font-mono capitalize">{
                    ({ sedentary:'Sedentario', beginner:'Principiante', intermediate:'Intermedio', advanced:'Avanzado' }[profile.level as string]) ?? profile.level
                  } · {String(profile.equipment) === 'gym' ? 'Gimnasio' : String(profile.equipment) === 'home' ? 'Casa' : String(profile.equipment) === 'outdoor' ? 'Aire libre' : 'Sin equipo'}</p>
                  <p className="text-gray-600 text-xs font-body mt-0.5">Tu plan de entrenamiento se adapta a esto cada semana.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-xs font-mono">
              Toma las medidas con cinta métrica sin ropa, relajado. El avatar te mostrará exactamente dónde medir cada mes.
            </p>
            {/* Body scan button */}
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              {savedPhoto ? (
                <div className="relative">
                  <img src={savedPhoto} alt="Foto corporal" className="w-full h-48 object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="text-white font-display font-bold text-sm">📸 Foto de referencia guardada</p>
                        <p className="text-gray-400 text-xs font-mono">{new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })}</p>
                      </div>
                      <button onClick={() => setShowBodyScan(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-mono bg-white/20 text-white">
                        Cambiar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowBodyScan(true)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                  style={{ background: '#1C1F28' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
                    📸
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-display font-bold text-sm">Foto corporal de referencia</p>
                    <p className="text-gray-500 text-xs font-body mt-0.5">Recomendado · Para comparar tu progreso visual mes a mes</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              )}
            </div>
            {[
              { field: 'neck', label: 'Cuello', unit: 'cm', placeholder: '38' },
              { field: 'chest', label: 'Pecho / Busto', unit: 'cm', placeholder: '95' },
              { field: 'waist', label: 'Cintura', unit: 'cm', placeholder: '80' },
              { field: 'hips', label: 'Cadera / Glúteos', unit: 'cm', placeholder: '95' },
              { field: 'bicep', label: 'Bíceps (relajado)', unit: 'cm', placeholder: '33' },
              { field: 'thigh', label: 'Muslo', unit: 'cm', placeholder: '55' },
            ].map((f) => (
              <Field
                key={f.field}
                label={f.label}
                unit={f.unit}
                placeholder={f.placeholder}
                onValue={(v) => set(f.field as keyof Measurements, v)}
                optional
              />
            ))}
          </>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-10 pt-3">
        <button
          onClick={handleContinue}
          disabled={(section === 'basic' && !canContinueBasic)}
          className="w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-widest transition-all disabled:opacity-30"
          style={{
            background: (section === 'basic' && canContinueBasic) || section === 'body' ? accentColor : '#333',
            color: '#111318',
            boxShadow:
              (section === 'basic' && canContinueBasic) || section === 'body'
                ? `0 0 20px ${accentColor}55`
                : 'none',
          }}
        >
          {section === 'basic' ? 'CONTINUAR' : section === 'goals' ? 'CONFIRMAR PLAN →' : 'ACTIVAR MI MODO MÁQUINA 🔥'}
        </button>
        {(section === 'goals' || section === 'body') && (
          <button
            onClick={() => { setMeasurements(data); completeOnboarding(); navigate('/dashboard') }}
            className="w-full py-3 mt-2 text-gray-600 font-mono text-sm"
          >
            Omitir por ahora
          </button>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  unit,
  placeholder,
  onValue,
  optional = false,
}: {
  label: string
  unit: string
  placeholder: string
  onValue: (v: string) => void
  optional?: boolean
}) {
  return (
    <div>
      <label className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-gray-500 mb-2">
        {label}
        {optional && (
          <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
        )}
      </label>
      <div className="relative">
        <input
          type="number"
          placeholder={placeholder}
          inputMode="decimal"
          onChange={(e) => onValue(e.target.value)}
          className="w-full bg-carbon-light border border-gray-700 rounded-xl px-4 py-3 pr-14 text-white font-mono placeholder-gray-700 focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt transition-colors text-base"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">
          {unit}
        </span>
      </div>
    </div>
  )
}
