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
const getToday = () => new Date().toISOString().split('T')[0]

type SelectedFood =
  | { source: 'db'; item: FoodItem }
  | { source: 'barcode'; item: OFFProduct }

type ScanState = 'idle' | 'scanning' | 'loading' | 'confirm' | 'notfound' | 'manual'

export default function FoodLog() {
  const navigate = useNavigate()
  const { foodLog, addFood, removeFood } = useAppStore()
  const [query, setQuery] = useState('')
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch')
  const [selected, setSelected] = useState<SelectedFood | null>(null)
  const [grams, setGrams] = useState('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scannedCode, setScannedCode] = useState('')
  const [added, setAdded] = useState<string | null>(null) // toast

  const results = useMemo(() => searchFoods(query), [query])
  const today = getToday()
  const todayLog = foodLog.filter(e => e.date === today)
  const totals = todayLog.reduce(
    (a, e) => ({ cal: a.cal+e.cal, prot: a.prot+e.prot, carbs: a.carbs+e.carbs, fat: a.fat+e.fat }),
    { cal:0, prot:0, carbs:0, fat:0 }
  )

  // ── Barcode flow ──────────────────────────────────────────────
  const handleBarcode = async (code: string) => {
    setScannedCode(code)
    setScanState('loading')
    try {
      const product = await lookupBarcode(code)
      if (!product || product.cal === 0) {
        setScanState('notfound')
      } else {
        setSelected({ source: 'barcode', item: product })
        setGrams(String(product.serving || 100))
        setScanState('confirm')
      }
    } catch {
      setScanState('notfound')
    }
  }

  // ── Add food entry ─────────────────────────────────────────────
  const getPreview = () => {
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
    const preview = getPreview()
    if (!preview) return
    const off = selected.source === 'barcode' ? (selected.item as OFFProduct) : null
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random()}`,
      foodId: selected.source === 'db' ? (selected.item as FoodItem).id : 'barcode',
      name: selected.item.name + (off?.brand ? ` · ${off.brand}` : ''),
      grams: parseFloat(grams),
      ...preview,
      mealType: activeMeal,
      date: today,
      timestamp: Date.now(),
    }
    addFood(entry)
    const label = entry.name.split(' · ')[0]
    setAdded(label)
    setTimeout(() => setAdded(null), 2500)
    setSelected(null)
    setQuery('')
    setGrams('')
    setScanState('idle')
    setScannedCode('')
  }

  const preview = getPreview()
  const showScanner = scanState === 'scanning'

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-carbon flex flex-col">

      {/* ── Scanner overlay ── */}
      {showScanner && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-carbon flex items-center justify-center z-50">
            <div className="text-volt font-mono animate-pulse">Iniciando cámara…</div>
          </div>
        }>
          <BarcodeScanner
            onResult={(code) => { setScanState('idle'); handleBarcode(code) }}
            onClose={() => setScanState('idle')}
          />
        </Suspense>
      )}

      {/* ── Barcode confirm modal ── */}
      {(scanState === 'confirm' || scanState === 'loading' || scanState === 'notfound' || scanState === 'manual') && (
        <div className="fixed inset-0 z-40 flex flex-col bg-carbon">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
            <h2 className="font-display font-black text-xl text-white uppercase">
              {scanState === 'loading' ? 'Buscando…' :
               scanState === 'notfound' ? 'No encontrado' :
               scanState === 'manual' ? 'Ingresar manualmente' :
               'Confirmar producto'}
            </h2>
            <button onClick={() => { setScanState('idle'); setSelected(null); setGrams('') }}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white text-xl">✕</button>
          </div>

          {/* Loading */}
          {scanState === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-volt border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 font-mono text-sm">Consultando base de datos…</p>
              <p className="text-gray-600 font-mono text-xs">{scannedCode}</p>
            </div>
          )}

          {/* Not found */}
          {scanState === 'notfound' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
              <p className="text-5xl">🔍</p>
              <p className="text-white font-display font-bold text-lg">Producto no encontrado</p>
              <p className="text-gray-500 text-sm font-body">
                Código: <span className="text-gray-300 font-mono">{scannedCode}</span>
              </p>
              <p className="text-gray-500 text-sm font-body">
                El producto no está en la base de datos. Puedes buscarlo por nombre o escanear otro código.
              </p>
              <div className="flex flex-col gap-3 w-full mt-2">
                <button onClick={() => setScanState('scanning')}
                  className="w-full py-3.5 rounded-xl font-display font-bold uppercase text-sm"
                  style={{ background: '#CEFF3C', color: '#111318' }}>
                  Escanear otro código
                </button>
                <button onClick={() => { setScanState('idle') }}
                  className="w-full py-3.5 rounded-xl font-display font-bold uppercase text-sm bg-gray-800 text-gray-300">
                  Buscar por nombre
                </button>
              </div>
            </div>
          )}

          {/* Product confirmed — enter grams */}
          {scanState === 'confirm' && selected && (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Product info */}
              <div className="flex gap-4 px-4 py-5 border-b border-gray-800">
                {selected.source === 'barcode' && (selected.item as OFFProduct).image && (
                  <img src={(selected.item as OFFProduct).image} alt=""
                    className="w-20 h-20 rounded-xl object-contain bg-white flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-display font-bold text-lg leading-tight">{selected.item.name}</p>
                  {selected.source === 'barcode' && (selected.item as OFFProduct).brand && (
                    <p className="text-gray-500 text-sm font-mono mt-0.5">{(selected.item as OFFProduct).brand}</p>
                  )}
                  <p className="text-gray-600 text-xs font-mono mt-1">por 100g</p>
                  {/* Macros per 100g */}
                  <div className="flex gap-3 mt-2">
                    {[
                      { l:'Kcal', v: selected.item.cal, c:'#CEFF3C' },
                      { l:'Prot', v: `${selected.item.prot}g`, c:'#E23A2E' },
                      { l:'Carbs', v: `${selected.item.carbs}g`, c:'#6FD3E8' },
                      { l:'Grasas', v: `${selected.item.fat}g`, c:'#DE782C' },
                    ].map(m => (
                      <div key={m.l} className="text-center">
                        <p className="font-display font-black text-sm" style={{ color: m.c }}>{m.v}</p>
                        <p className="text-gray-600 text-xs font-mono">{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="px-4 py-5">
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-3">Cantidad consumida</p>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    value={grams}
                    onChange={e => setGrams(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white font-mono text-3xl focus:outline-none focus:border-volt text-center"
                    autoFocus
                  />
                  <span className="text-gray-500 font-mono text-base w-8">
                    {selected.source === 'barcode' ? (selected.item as OFFProduct).unit : 'g'}
                  </span>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[30, 50, 100, 150, 200, 250].map(g => (
                    <button key={g} onClick={() => setGrams(String(g))}
                      className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
                      style={{
                        background: grams === String(g) ? '#CEFF3C' : '#1C1F28',
                        color: grams === String(g) ? '#111318' : '#666',
                      }}>{g}g</button>
                  ))}
                </div>
              </div>

              {/* Preview macros */}
              {preview && (
                <div className="mx-4 rounded-2xl p-4 mb-4" style={{ background: '#1C1F28' }}>
                  <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-3 text-center">
                    Macros para {grams}g
                  </p>
                  <div className="flex gap-3">
                    {[
                      { l:'Kcal', v: preview.cal, c:'#CEFF3C' },
                      { l:'Proteína', v: `${preview.prot}g`, c:'#E23A2E' },
                      { l:'Carbs', v: `${preview.carbs}g`, c:'#6FD3E8' },
                      { l:'Grasas', v: `${preview.fat}g`, c:'#DE782C' },
                    ].map(m => (
                      <div key={m.l} className="flex-1 text-center">
                        <p className="font-display font-black text-xl" style={{ color: m.c }}>{m.v}</p>
                        <p className="text-gray-600 text-xs font-mono">{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meal selector */}
              <div className="px-4 mb-4">
                <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-2">Agregar a</p>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_ORDER.map(m => (
                    <button key={m} onClick={() => setActiveMeal(m)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-widest transition-all"
                      style={{
                        background: activeMeal === m ? '#CEFF3C' : '#1C1F28',
                        color: activeMeal === m ? '#111318' : '#666',
                        fontWeight: activeMeal === m ? 700 : 400,
                      }}>
                      {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add button */}
              <div className="px-4 pb-10">
                <button
                  onClick={handleAdd}
                  disabled={!preview}
                  className="w-full py-4 rounded-2xl font-display font-black uppercase text-xl disabled:opacity-40 transition-all active:scale-95"
                  style={{ background: '#CEFF3C', color: '#111318' }}
                >
                  ✓ Agregar al registro
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Toast ── */}
      {added && (
        <div className="fixed top-6 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
          style={{ background: '#CEFF3C' }}>
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-display font-black text-carbon text-sm uppercase">{added}</p>
            <p className="font-mono text-carbon/70 text-xs">agregado a {MEAL_LABELS[activeMeal]}</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="font-display font-black text-2xl text-white uppercase">Registrar comida</h1>
          <p className="text-gray-500 text-xs font-mono">
            {totals.cal > 0 ? `${Math.round(totals.cal)} kcal · ${Math.round(totals.prot)}g proteína hoy` : 'Sin registros hoy'}
          </p>
        </div>
      </div>

      {/* ── Meal tabs ── */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1">
        {MEAL_ORDER.map(m => (
          <button key={m} onClick={() => setActiveMeal(m)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeMeal === m ? '#CEFF3C' : '#1C1F28',
              color: activeMeal === m ? '#111318' : '#666',
              fontWeight: activeMeal === m ? 700 : 400,
            }}>
            {MEAL_ICONS[m]} {MEAL_LABELS[m]}
          </button>
        ))}
      </div>

      {/* ── Scan button ── */}
      <div className="px-4 mb-3">
        <button
          onClick={() => setScanState('scanning')}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 font-display font-bold uppercase text-sm tracking-widest transition-all hover:border-volt hover:text-volt active:scale-95"
          style={{ borderColor: '#2A2D38', color: '#888' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          Escanear código de barras
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-4 mb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
            placeholder="Buscar por nombre…"
            className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt transition-colors"
          />
        </div>
      </div>

      {/* ── DB product confirm inline ── */}
      {selected && selected.source === 'db' && (
        <div className="mx-4 mb-3 rounded-2xl p-4 border-2 border-volt" style={{ background: 'rgba(206,255,60,0.05)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white font-display font-bold text-base">{selected.item.name}</p>
              <p className="text-gray-600 text-xs font-mono">{selected.item.cal} kcal · {selected.item.prot}g prot · por 100g</p>
            </div>
            <button onClick={() => { setSelected(null); setGrams('') }} className="text-gray-600 hover:text-white text-lg ml-3">✕</button>
          </div>
          <div className="flex gap-2 items-center mb-3">
            <input
              type="number"
              value={grams}
              onChange={e => setGrams(e.target.value)}
              placeholder="100"
              className="flex-1 bg-carbon border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-2xl focus:outline-none focus:border-volt text-center"
              autoFocus
            />
            <span className="text-gray-500 font-mono text-sm">g</span>
            <button
              onClick={handleAdd}
              disabled={!preview}
              className="px-5 py-3 rounded-xl font-display font-bold uppercase text-carbon text-sm disabled:opacity-40 active:scale-95"
              style={{ background: '#CEFF3C' }}
            >Agregar</button>
          </div>
          {preview && (
            <div className="flex gap-3 pt-2 border-t border-gray-800">
              {[{ l:'Kcal', v:preview.cal, c:'#CEFF3C' },{ l:'Prot', v:`${preview.prot}g`, c:'#E23A2E' },{ l:'Carbs', v:`${preview.carbs}g`, c:'#6FD3E8' },{ l:'Grasas', v:`${preview.fat}g`, c:'#DE782C' }].map(m =>
                <div key={m.l} className="flex-1 text-center">
                  <p className="font-display font-black text-sm" style={{ color: m.c }}>{m.v}</p>
                  <p className="text-gray-600 text-xs font-mono">{m.l}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Search results ── */}
      {!selected && (
        <div className="flex-1 px-4 overflow-y-auto space-y-1.5">
          {results.length === 0 && query ? (
            <p className="text-gray-600 text-center font-mono text-sm py-8">
              Sin resultados — prueba escanear el código de barras
            </p>
          ) : (
            results.map(food => (
              <button
                key={food.id}
                onClick={() => { setSelected({ source: 'db', item: food }); setGrams(String(food.serving)) }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 transition-colors text-left"
              >
                <div>
                  <p className="text-white font-body text-sm font-medium">{food.name}</p>
                  <p className="text-gray-500 text-xs font-mono">{food.category} · {food.serving}{food.unit}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-volt font-display font-bold text-sm">{Math.round(food.cal * food.serving / 100)}</p>
                  <p className="text-gray-600 text-xs font-mono">kcal</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Today's log ── */}
      {todayLog.length > 0 && (
        <div className="px-4 pb-8 pt-4 border-t border-gray-800 mt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Registro de hoy</p>
            <p className="font-mono text-xs text-volt">{Math.round(totals.cal)} kcal total</p>
          </div>
          {MEAL_ORDER.filter(m => todayLog.some(e => e.mealType === m)).map(meal => (
            <div key={meal} className="mb-3">
              <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-1.5">{MEAL_ICONS[meal]} {MEAL_LABELS[meal]}</p>
              {todayLog.filter(e => e.mealType === meal).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-white text-sm font-body truncate">{e.name}</p>
                    <p className="text-gray-600 text-xs font-mono">{e.grams}g · {e.prot}g prot</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-volt font-mono font-bold text-sm">{e.cal} kcal</p>
                    <button onClick={() => removeFood(e.id)} className="text-gray-700 hover:text-red-500 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {/* Day totals */}
          <div className="mt-3 pt-3 border-t border-gray-800 flex gap-3">
            {[
              { l:'Total', v:`${Math.round(totals.cal)} kcal`, c:'#CEFF3C' },
              { l:'Prot', v:`${Math.round(totals.prot)}g`, c:'#E23A2E' },
              { l:'Carbs', v:`${Math.round(totals.carbs)}g`, c:'#6FD3E8' },
              { l:'Grasas', v:`${Math.round(totals.fat)}g`, c:'#DE782C' },
            ].map(m => (
              <div key={m.l} className="flex-1 text-center">
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
