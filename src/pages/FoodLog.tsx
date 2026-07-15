import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { searchFoods, calcMacros, type FoodItem } from '../assets/foods'
import type { MealType, FoodEntry } from '../types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '⚡',
}
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const today = () => new Date().toISOString().split('T')[0]

export default function FoodLog() {
  const navigate = useNavigate()
  const { foodLog, addFood, removeFood } = useAppStore()
  const [query, setQuery] = useState('')
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch')
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [grams, setGrams] = useState('')

  const results = useMemo(() => searchFoods(query), [query])
  const todayLog = foodLog.filter(e => e.date === today())
  const todayTotals = todayLog.reduce(
    (acc, e) => ({ cal: acc.cal + e.cal, prot: acc.prot + e.prot, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { cal: 0, prot: 0, carbs: 0, fat: 0 }
  )

  const handleAdd = () => {
    if (!selected || !grams) return
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0) return
    const macros = calcMacros(selected, g)
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random()}`,
      foodId: selected.id,
      name: selected.name,
      grams: g,
      ...macros,
      mealType: activeMeal,
      date: today(),
      timestamp: Date.now(),
    }
    addFood(entry)
    setSelected(null)
    setQuery('')
    setGrams('')
  }

  const preview = selected && grams ? calcMacros(selected, parseFloat(grams) || 0) : null

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 className="font-display font-black text-2xl text-white uppercase">Registrar comida</h1>
          <p className="text-gray-500 text-xs font-mono">{todayTotals.cal} kcal hoy · {Math.round(todayTotals.prot)}g prot</p>
        </div>
      </div>

      {/* Meal selector */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1">
        {MEAL_ORDER.map(meal => (
          <button
            key={meal}
            onClick={() => setActiveMeal(meal)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-all"
            style={{
              background: activeMeal === meal ? '#CEFF3C' : '#1C1F28',
              color: activeMeal === meal ? '#111318' : '#666',
              fontWeight: activeMeal === meal ? 700 : 400,
            }}
          >
            {MEAL_ICONS[meal]} {MEAL_LABELS[meal]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
            placeholder="Buscar alimento… (pollo, arroz, palta…)"
            className="w-full bg-carbon-light border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt transition-colors"
          />
        </div>
      </div>

      {/* Selected food — quantity input */}
      {selected && (
        <div className="mx-4 mb-3 rounded-2xl p-4 border-2 border-volt bg-volt/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white font-display font-bold text-base">{selected.name}</p>
              <p className="text-gray-500 text-xs font-mono">{selected.cal} kcal · {selected.prot}g prot · {selected.carbs}g carbs · {selected.fat}g grasas por 100g</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white">✕</button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={grams}
              onChange={e => setGrams(e.target.value)}
              placeholder={`${selected.serving}`}
              className="flex-1 bg-carbon border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-lg focus:outline-none focus:border-volt"
              autoFocus
            />
            <span className="text-gray-500 font-mono text-sm">{selected.unit}</span>
            <button
              onClick={handleAdd}
              disabled={!grams || parseFloat(grams) <= 0}
              className="px-4 py-2.5 rounded-xl font-display font-bold uppercase text-carbon disabled:opacity-40 transition-all"
              style={{ background: '#CEFF3C' }}
            >
              + Agregar
            </button>
          </div>
          {preview && parseFloat(grams) > 0 && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-800">
              {[
                { label: 'Kcal', val: preview.cal, color: '#CEFF3C' },
                { label: 'Prot', val: `${preview.prot}g`, color: '#E23A2E' },
                { label: 'Carbs', val: `${preview.carbs}g`, color: '#6FD3E8' },
                { label: 'Grasas', val: `${preview.fat}g`, color: '#DE782C' },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="font-display font-black text-base" style={{ color: m.color }}>{m.val}</p>
                  <p className="text-gray-600 text-xs font-mono">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search results */}
      {!selected && (
        <div className="flex-1 px-4 overflow-y-auto space-y-1.5 pb-4">
          {results.length === 0 && query ? (
            <p className="text-gray-600 text-center font-mono text-sm py-8">Sin resultados para "{query}"</p>
          ) : (
            results.map(food => (
              <button
                key={food.id}
                onClick={() => { setSelected(food); setGrams(String(food.serving)) }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-carbon-light hover:bg-gray-800 transition-colors text-left"
              >
                <div>
                  <p className="text-white font-body text-sm font-medium">{food.name}</p>
                  <p className="text-gray-500 text-xs font-mono">{food.category} · porción {food.serving}{food.unit}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-volt font-display font-bold text-sm">{Math.round(food.cal * food.serving / 100)}</p>
                  <p className="text-gray-600 text-xs font-mono">kcal</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Today's log */}
      {todayLog.length > 0 && !selected && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-800">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Hoy registrado</p>
          {MEAL_ORDER.filter(m => todayLog.some(e => e.mealType === m)).map(meal => (
            <div key={meal} className="mb-3">
              <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-1.5">
                {MEAL_ICONS[meal]} {MEAL_LABELS[meal]}
              </p>
              {todayLog.filter(e => e.mealType === meal).map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div>
                    <p className="text-white text-sm font-body">{entry.name}</p>
                    <p className="text-gray-600 text-xs font-mono">{entry.grams}g · {entry.prot}g prot</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-volt font-mono font-bold text-sm">{entry.cal} kcal</p>
                    <button onClick={() => removeFood(entry.id)} className="text-gray-700 hover:text-red-500 transition-colors text-lg leading-none">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {/* Day total */}
          <div className="mt-3 pt-3 flex gap-4">
            {[
              { l: 'Total kcal', v: todayTotals.cal, c: '#CEFF3C' },
              { l: 'Prot', v: `${Math.round(todayTotals.prot)}g`, c: '#E23A2E' },
              { l: 'Carbs', v: `${Math.round(todayTotals.carbs)}g`, c: '#6FD3E8' },
              { l: 'Grasas', v: `${Math.round(todayTotals.fat)}g`, c: '#DE782C' },
            ].map(m => (
              <div key={m.l} className="text-center flex-1">
                <p className="font-display font-black text-sm" style={{ color: m.c }}>{m.v}</p>
                <p className="text-gray-600 text-xs font-mono">{m.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
