import { useState, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { searchFoods, calcMacros, type FoodItem } from '../assets/foods'
import { lookupBarcode, type OFFProduct } from '../utils/openFoodFacts'
import type { MealType, FoodEntry } from '../types'

const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

const MEAL_LABELS: Record<MealType, string> = { breakfast:'Desayuno', lunch:'Almuerzo', dinner:'Cena', snack:'Snack' }
const MEAL_ICONS: Record<MealType, string> = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'⚡' }
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const today = () => new Date().toISOString().split('T')[0]

type SelectedFood = { source: 'db'; item: FoodItem } | { source: 'barcode'; item: OFFProduct }

export default function FoodLog() {
  const navigate = useNavigate()
  const { foodLog, addFood, removeFood } = useAppStore()
  const [query, setQuery] = useState('')
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch')
  const [selected, setSelected] = useState<SelectedFood | null>(null)
  const [grams, setGrams] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scanStatus, setScanStatus] = useState<'idle'|'loading'|'notfound'>('idle')

  const results = useMemo(() => searchFoods(query), [query])
  const todayLog = foodLog.filter(e => e.date === today())
  const totals = todayLog.reduce(
    (a, e) => ({ cal: a.cal+e.cal, prot: a.prot+e.prot, carbs: a.carbs+e.carbs, fat: a.fat+e.fat }),
    { cal:0, prot:0, carbs:0, fat:0 }
  )

  const handleBarcode = async (code: string) => {
    setShowScanner(false)
    setScanStatus('loading')
    const product = await lookupBarcode(code)
    setScanStatus('idle')
    if (!product) { setScanStatus('notfound'); return }
    setSelected({ source: 'barcode', item: product })
    setGrams(String(product.serving))
    setQuery('')
  }

  const getItemMacros = () => {
    if (!selected || !grams) return null
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0) return null
    const ratio = g / 100
    const it = selected.item
    return {
      cal: Math.round(it.cal * ratio),
      prot: Math.round(it.prot * ratio * 10) / 10,
      carbs: Math.round(it.carbs * ratio * 10) / 10,
      fat: Math.round(it.fat * ratio * 10) / 10,
    }
  }

  const handleAdd = () => {
    if (!selected || !grams) return
    const preview = getItemMacros()
    if (!preview) return
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random()}`,
      foodId: selected.source === 'db' ? (selected.item as FoodItem).id : 'barcode',
      name: selected.item.name + (selected.source === 'barcode' && (selected.item as OFFProduct).brand ? ` · ${(selected.item as OFFProduct).brand}` : ''),
      grams: parseFloat(grams),
      ...preview,
      mealType: activeMeal,
      date: today(),
      timestamp: Date.now(),
    }
    addFood(entry)
    setSelected(null); setQuery(''); setGrams(''); setScanStatus('idle')
  }

  const preview = getItemMacros()

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Barcode scanner overlay */}
      {showScanner && (
        <Suspense fallback={<div className="fixed inset-0 bg-carbon flex items-center justify-center z-50"><div className="text-volt font-mono animate-pulse">Cargando cámara…</div></div>}>
          <BarcodeScanner onResult={handleBarcode} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="font-display font-black text-2xl text-white uppercase">Registrar comida</h1>
          <p className="text-gray-500 text-xs font-mono">{totals.cal} kcal · {Math.round(totals.prot)}g proteína hoy</p>
        </div>
      </div>

      {/* Meal tabs */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {MEAL_ORDER.map(m => (
          <button key={m} onClick={() => setActiveMeal(m)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0"
            style={{ background: activeMeal===m ? '#CEFF3C' : '#1C1F28', color: activeMeal===m ? '#111318' : '#666', fontWeight: activeMeal===m ? 700 : 400 }}>
            {MEAL_ICONS[m]} {MEAL_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Capture buttons */}
      <div className="flex gap-2 px-4 mb-3">
        <button
          onClick={() => setShowScanner(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all hover:border-volt hover:text-volt"
          style={{ borderColor: '#2A2D38', color: '#888' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          <span className="font-mono text-xs uppercase tracking-widest">Código de barras</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 opacity-40 cursor-not-allowed"
          style={{ borderColor: '#2A2D38', color: '#888' }}
          title="Próximamente — requiere IA"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="font-mono text-xs uppercase tracking-widest">Foto del plato</span>
        </button>
      </div>

      {scanStatus === 'loading' && (
        <div className="mx-4 mb-3 py-4 rounded-2xl bg-gray-900 flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-volt border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm font-mono">Buscando en base de datos…</span>
        </div>
      )}
      {scanStatus === 'notfound' && (
        <div className="mx-4 mb-3 py-4 rounded-2xl bg-gray-900 text-center">
          <p className="text-gray-400 text-sm font-body">Producto no encontrado. Busca el nombre manualmente.</p>
          <button onClick={() => setScanStatus('idle')} className="text-volt text-xs font-mono mt-1">Entendido</button>
        </div>
      )}

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" value={query} onChange={e => { setQuery(e.target.value); setSelected(null) }}
            placeholder="Buscar por nombre…"
            className="w-full bg-carbon-light border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt transition-colors" />
        </div>
      </div>

      {/* Selected food — quantity input */}
      {selected && (
        <div className="mx-4 mb-3 rounded-2xl p-4 border-2 border-volt bg-volt/5">
          <div className="flex items-start gap-3 mb-3">
            {selected.source === 'barcode' && (selected.item as OFFProduct).image && (
              <img src={(selected.item as OFFProduct).image} alt="" className="w-14 h-14 rounded-xl object-contain bg-white" />
            )}
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base leading-tight">{selected.item.name}</p>
              {selected.source === 'barcode' && (selected.item as OFFProduct).brand && (
                <p className="text-gray-500 text-xs font-mono">{(selected.item as OFFProduct).brand}</p>
              )}
              <p className="text-gray-600 text-xs font-mono mt-0.5">{selected.item.cal} kcal · {selected.item.prot}g prot por 100g</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white text-lg flex-shrink-0">✕</button>
          </div>
          <div className="flex gap-2 items-center mb-3">
            <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
              placeholder="100"
              className="flex-1 bg-carbon border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-xl focus:outline-none focus:border-volt"
              autoFocus />
            <span className="text-gray-500 font-mono text-sm w-6">{selected.source === 'barcode' ? (selected.item as OFFProduct).unit : 'g'}</span>
            <button onClick={handleAdd} disabled={!preview}
              className="px-5 py-2.5 rounded-xl font-display font-bold uppercase text-carbon text-sm disabled:opacity-40"
              style={{ background: '#CEFF3C' }}>
              + Agregar
            </button>
          </div>
          {preview && (
            <div className="flex gap-3 pt-2 border-t border-gray-800">
              {[{ l:'Kcal', v:preview.cal, c:'#CEFF3C' },{ l:'Prot', v:`${preview.prot}g`, c:'#E23A2E' },{ l:'Carbs', v:`${preview.carbs}g`, c:'#6FD3E8' },{ l:'Grasas', v:`${preview.fat}g`, c:'#DE782C' }]
                .map(m => <div key={m.l} className="text-center flex-1"><p className="font-display font-black text-sm" style={{color:m.c}}>{m.v}</p><p className="text-gray-600 text-xs font-mono">{m.l}</p></div>)}
            </div>
          )}
        </div>
      )}

      {/* Results list */}
      {!selected && (
        <div className="flex-1 px-4 overflow-y-auto space-y-1.5 pb-4">
          {results.length === 0 && query ? (
            <p className="text-gray-600 text-center font-mono text-sm py-8">Sin resultados · prueba con código de barras</p>
          ) : (
            results.map(food => (
              <button key={food.id} onClick={() => { setSelected({ source:'db', item:food }); setGrams(String(food.serving)) }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-carbon-light hover:bg-gray-800 transition-colors text-left">
                <div>
                  <p className="text-white font-body text-sm font-medium">{food.name}</p>
                  <p className="text-gray-500 text-xs font-mono">{food.category} · {food.serving}{food.unit}</p>
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
        <div className="px-4 pb-8 pt-2 border-t border-gray-800">
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Comidas de hoy</p>
          {MEAL_ORDER.filter(m => todayLog.some(e => e.mealType === m)).map(meal => (
            <div key={meal} className="mb-3">
              <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-1.5">{MEAL_ICONS[meal]} {MEAL_LABELS[meal]}</p>
              {todayLog.filter(e => e.mealType === meal).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div><p className="text-white text-sm font-body">{e.name}</p><p className="text-gray-600 text-xs font-mono">{e.grams}g · {e.prot}g prot</p></div>
                  <div className="flex items-center gap-3">
                    <p className="text-volt font-mono font-bold text-sm">{e.cal} kcal</p>
                    <button onClick={() => removeFood(e.id)} className="text-gray-700 hover:text-red-500 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="mt-2 pt-3 flex gap-3">
            {[{l:'Total',v:totals.cal+'kcal',c:'#CEFF3C'},{l:'Prot',v:Math.round(totals.prot)+'g',c:'#E23A2E'},{l:'Carbs',v:Math.round(totals.carbs)+'g',c:'#6FD3E8'},{l:'Grasas',v:Math.round(totals.fat)+'g',c:'#DE782C'}]
              .map(m => <div key={m.l} className="flex-1 text-center"><p className="font-display font-black text-sm" style={{color:m.c}}>{m.v}</p><p className="text-gray-600 text-xs font-mono">{m.l}</p></div>)}
          </div>
        </div>
      )}
    </div>
  )
}
