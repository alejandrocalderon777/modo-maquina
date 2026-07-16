import { useState, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { FOODS, calcMacros, type FoodItem } from '../assets/foods'
import { lookupBarcode, type OFFProduct } from '../utils/openFoodFacts'
import { RECIPES, filterRecipes, type Recipe } from '../assets/recipes'
import type { MealType, FoodEntry } from '../types'

const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

const MEAL_LABELS: Record<MealType, string> = { breakfast:'Desayuno', lunch:'Almuerzo', dinner:'Cena', snack:'Snack' }
const MEAL_ICONS: Record<MealType, string>  = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'⚡' }
const MEAL_ORDER: MealType[] = ['breakfast','lunch','dinner','snack']
const getToday = () => new Date().toISOString().split('T')[0]

const CATEGORY_ORDER = ['Proteínas','Carbohidratos','Verduras','Frutas','Grasas','Lácteos','Platos']
const CATEGORY_ICONS: Record<string,string> = {
  'Proteínas':'🥩','Carbohidratos':'🍚','Verduras':'🥦','Frutas':'🍎','Grasas':'🥑','Lácteos':'🥛','Platos':'🍽️'
}
const RECIPE_CATS = ['Todos','Desayuno','Almuerzo','Cena','Snack']

type MainTab = 'foods' | 'recipes' | 'scan'
type ScanState = 'idle' | 'scanning' | 'loading' | 'confirm' | 'notfound'
type SelectedFood = { source: 'db'; item: FoodItem } | { source: 'barcode'; item: OFFProduct } | { source: 'recipe'; item: Recipe }

export default function FoodLog() {
  const navigate = useNavigate()
  const { foodLog, addFood, removeFood } = useAppStore()
  const [tab, setTab] = useState<MainTab>('foods')
  const [query, setQuery] = useState('')
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch')
  const [selected, setSelected] = useState<SelectedFood | null>(null)
  const [grams, setGrams] = useState('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scannedCode, setScannedCode] = useState('')
  const [recipeCat, setRecipeCat] = useState('Todos')
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const [added, setAdded] = useState<string | null>(null)

  const today = getToday()
  const todayLog = foodLog.filter(e => e.date === today)
  const totals = todayLog.reduce((a,e) => ({ cal:a.cal+e.cal, prot:a.prot+e.prot, carbs:a.carbs+e.carbs, fat:a.fat+e.fat }), {cal:0,prot:0,carbs:0,fat:0})

  // ── Grouped foods ───────────────────────────────────────────
  const groupedFoods = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? FOODS.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)) : FOODS
    const groups: Record<string, FoodItem[]> = {}
    for (const f of filtered) {
      if (!groups[f.category]) groups[f.category] = []
      groups[f.category].push(f)
    }
    return CATEGORY_ORDER.filter(c => groups[c]).map(c => ({ category: c, items: groups[c] }))
  }, [query])

  const recipes = useMemo(() => filterRecipes(query, recipeCat === 'Todos' ? undefined : recipeCat), [query, recipeCat])

  // ── Barcode flow ─────────────────────────────────────────────
  const handleBarcode = async (code: string) => {
    setScannedCode(code)
    setScanState('loading')
    const product = await lookupBarcode(code)
    if (!product) { setScanState('notfound'); return }
    setSelected({ source:'barcode', item:product })
    setGrams(String(product.serving || 100))
    setScanState('confirm')
  }

  // ── Macro preview ────────────────────────────────────────────
  const getPreview = () => {
    if (!selected || !grams) return null
    const g = parseFloat(grams)
    if (isNaN(g) || g <= 0) return null
    const it = selected.item
    if (selected.source === 'recipe') {
      const r = it as Recipe
      return { cal:r.cal, prot:r.prot, carbs:r.carbs, fat:r.fat }
    }
    const ratio = g / 100
    return {
      cal: Math.round(it.cal * ratio),
      prot: Math.round(it.prot * ratio * 10) / 10,
      carbs: Math.round(it.carbs * ratio * 10) / 10,
      fat: Math.round(it.fat * ratio * 10) / 10,
    }
  }

  const handleAdd = () => {
    if (!selected) return
    const preview = getPreview()
    if (!preview) return
    const off = selected.source === 'barcode' ? (selected.item as OFFProduct) : null
    const rec = selected.source === 'recipe' ? (selected.item as Recipe) : null
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random()}`,
      foodId: selected.source === 'db' ? (selected.item as FoodItem).id : selected.source,
      name: selected.item.name + (off?.brand ? ` · ${off.brand}` : ''),
      grams: rec ? 1 : parseFloat(grams),
      ...preview,
      mealType: activeMeal,
      date: today,
      timestamp: Date.now(),
    }
    addFood(entry)
    setAdded(entry.name.split(' · ')[0])
    setTimeout(() => setAdded(null), 2500)
    setSelected(null); setQuery(''); setGrams(''); setScanState('idle')
  }

  const preview = getPreview()

  // ── Confirm modal (barcode + recipe) ─────────────────────────
  const showModal = scanState === 'confirm' || scanState === 'loading' || scanState === 'notfound' ||
    (selected !== null && (selected.source === 'barcode' || selected.source === 'recipe'))

  return (
    <div className="min-h-screen bg-carbon flex flex-col">
      {/* Scanner overlay */}
      {scanState === 'scanning' && (
        <Suspense fallback={<div className="fixed inset-0 bg-carbon flex items-center justify-center z-50"><div className="text-volt font-mono animate-pulse">Iniciando cámara…</div></div>}>
          <BarcodeScanner onResult={c => { setScanState('idle'); handleBarcode(c) }} onClose={() => setScanState('idle')} />
        </Suspense>
      )}

      {/* ── Confirm / loading modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex flex-col bg-carbon">
          <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-800">
            <h2 className="font-display font-black text-xl text-white uppercase">
              {scanState === 'loading' ? 'Buscando…' : scanState === 'notfound' ? 'No encontrado' : 'Confirmar'}
            </h2>
            <button onClick={() => { setScanState('idle'); setSelected(null); setGrams('') }}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white text-xl">✕</button>
          </div>

          {scanState === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-volt border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 font-mono text-sm">Consultando base de datos…</p>
              <p className="text-gray-600 font-mono text-xs">{scannedCode}</p>
            </div>
          )}

          {scanState === 'notfound' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
              <p className="text-5xl">🔍</p>
              <p className="text-white font-display font-bold text-lg">Producto no encontrado</p>
              <p className="text-gray-500 text-sm font-mono">{scannedCode}</p>
              <button onClick={() => setScanState('scanning')} className="w-full py-3.5 rounded-xl font-display font-bold uppercase text-sm" style={{background:'#CEFF3C',color:'#111318'}}>Escanear otro</button>
              <button onClick={() => { setScanState('idle'); setTab('foods') }} className="w-full py-3.5 rounded-xl bg-gray-800 text-gray-300 font-display font-bold uppercase text-sm">Buscar por nombre</button>
            </div>
          )}

          {selected && (scanState === 'confirm' || selected.source === 'recipe') && (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Product / recipe info */}
              <div className="flex gap-4 px-4 py-5 border-b border-gray-800">
                {selected.source === 'recipe' && <span className="text-5xl flex-shrink-0">{(selected.item as Recipe).emoji}</span>}
                {selected.source === 'barcode' && (selected.item as OFFProduct).image && (
                  <img src={(selected.item as OFFProduct).image} alt="" className="w-20 h-20 rounded-xl object-contain bg-white flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-white font-display font-bold text-lg leading-tight">{selected.item.name}</p>
                  {selected.source === 'barcode' && (selected.item as OFFProduct).brand && (
                    <p className="text-gray-500 text-sm font-mono">{(selected.item as OFFProduct).brand}</p>
                  )}
                  {selected.source === 'recipe' && (
                    <p className="text-gray-500 text-xs font-mono mt-1">{(selected.item as Recipe).tag} · {(selected.item as Recipe).time} min</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    {[{l:'Kcal',v:selected.item.cal,c:'#CEFF3C'},{l:'Prot',v:`${selected.item.prot}g`,c:'#E23A2E'},{l:'Carbs',v:`${selected.item.carbs}g`,c:'#6FD3E8'},{l:'Grasas',v:`${selected.item.fat}g`,c:'#DE782C'}].map(m=>(
                      <div key={m.l} className="text-center">
                        <p className="font-display font-black text-sm" style={{color:m.c}}>{m.v}</p>
                        <p className="text-gray-600 text-xs font-mono">{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantity (not for recipes — fixed 1 portion) */}
              {selected.source !== 'recipe' && (
                <div className="px-4 py-5">
                  <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-3">Cantidad</p>
                  <div className="flex gap-3 items-center">
                    <input type="number" value={grams} onChange={e=>setGrams(e.target.value)} autoFocus
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white font-mono text-3xl focus:outline-none focus:border-volt text-center" />
                    <span className="text-gray-500 font-mono text-base w-8">{selected.source==='barcode'?(selected.item as OFFProduct).unit:'g'}</span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[30,50,100,150,200,250].map(g=>(
                      <button key={g} onClick={()=>setGrams(String(g))} className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
                        style={{background:grams===String(g)?'#CEFF3C':'#1C1F28',color:grams===String(g)?'#111318':'#666'}}>{g}g</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div className="mx-4 rounded-2xl p-4 mb-4" style={{background:'#1C1F28'}}>
                  <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-3 text-center">
                    {selected.source==='recipe' ? '1 porción completa' : `Macros para ${grams}g`}
                  </p>
                  <div className="flex gap-3">
                    {[{l:'Kcal',v:preview.cal,c:'#CEFF3C'},{l:'Proteína',v:`${preview.prot}g`,c:'#E23A2E'},{l:'Carbs',v:`${preview.carbs}g`,c:'#6FD3E8'},{l:'Grasas',v:`${preview.fat}g`,c:'#DE782C'}].map(m=>(
                      <div key={m.l} className="flex-1 text-center">
                        <p className="font-display font-black text-xl" style={{color:m.c}}>{m.v}</p>
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
                  {MEAL_ORDER.map(m=>(
                    <button key={m} onClick={()=>setActiveMeal(m)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-widest transition-all"
                      style={{background:activeMeal===m?'#CEFF3C':'#1C1F28',color:activeMeal===m?'#111318':'#666',fontWeight:activeMeal===m?700:400}}>
                      {MEAL_ICONS[m]} {MEAL_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 pb-10">
                <button onClick={handleAdd} disabled={!preview} className="w-full py-4 rounded-2xl font-display font-black uppercase text-xl disabled:opacity-40 active:scale-95 transition-transform"
                  style={{background:'#CEFF3C',color:'#111318'}}>
                  ✓ Agregar al registro
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Toast ── */}
      {added && (
        <div className="fixed top-6 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl" style={{background:'#CEFF3C'}}>
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-display font-black text-carbon text-sm uppercase">{added}</p>
            <p className="font-mono text-carbon/70 text-xs">agregado a {MEAL_LABELS[activeMeal]}</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3">
        <button onClick={()=>navigate('/dashboard')} className="text-gray-500 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="font-display font-black text-2xl text-white uppercase">Registrar comida</h1>
          <p className="text-gray-500 text-xs font-mono">{totals.cal > 0 ? `${Math.round(totals.cal)} kcal · ${Math.round(totals.prot)}g proteína hoy` : 'Sin registros hoy'}</p>
        </div>
      </div>

      {/* ── Main tabs ── */}
      <div className="flex gap-1 px-4 mb-3 bg-gray-900 rounded-2xl mx-4 p-1">
        {([
          { id:'foods',   label:'Alimentos', icon:'🔍' },
          { id:'recipes', label:'Recetas',   icon:'👨‍🍳' },
          { id:'scan',    label:'Escanear',  icon:'📷' },
        ] as {id:MainTab;label:string;icon:string}[]).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest transition-all"
            style={{background:tab===t.id?'#CEFF3C':'transparent',color:tab===t.id?'#111318':'#666',fontWeight:tab===t.id?700:400}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── FOODS tab ── */}
      {tab === 'foods' && (
        <>
          {/* Search */}
          <div className="px-4 mb-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar alimento…"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white font-body placeholder-gray-600 focus:outline-none focus:border-volt transition-colors" />
              {query && <button onClick={()=>setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>}
            </div>
          </div>

          {/* Grouped food list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {groupedFoods.length === 0 ? (
              <p className="text-gray-600 text-center font-mono text-sm py-8">Sin resultados</p>
            ) : (
              groupedFoods.map(group => (
                <div key={group.category} className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{CATEGORY_ICONS[group.category]}</span>
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">{group.category}</p>
                  </div>
                  <div className="rounded-2xl overflow-hidden" style={{background:'#1C1F28'}}>
                    {group.items.map((food, i) => (
                      <button key={food.id}
                        onClick={()=>{ setSelected({source:'db',item:food}); setGrams(String(food.serving)); setScanState('confirm') }}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-700 transition-colors active:scale-95"
                        style={{borderBottom: i < group.items.length-1 ? '1px solid #252933' : 'none'}}>
                        <div>
                          <p className="text-white font-body text-sm font-medium">{food.name}</p>
                          <p className="text-gray-500 text-xs font-mono">{food.prot}g prot · por 100g</p>
                        </div>
                        <div className="text-right ml-3 flex-shrink-0">
                          <p className="text-volt font-display font-bold text-sm">{Math.round(food.cal * food.serving / 100)}</p>
                          <p className="text-gray-600 text-xs font-mono">kcal/{food.serving}{food.unit}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── RECIPES tab ── */}
      {tab === 'recipes' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 px-4 mb-3 overflow-x-auto pb-1">
            {RECIPE_CATS.map(c=>(
              <button key={c} onClick={()=>setRecipeCat(c)}
                className="px-3 py-1.5 rounded-xl font-mono text-xs uppercase tracking-widest whitespace-nowrap flex-shrink-0 transition-all"
                style={{background:recipeCat===c?'#CEFF3C':'#1C1F28',color:recipeCat===c?'#111318':'#666',fontWeight:recipeCat===c?700:400}}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {recipes.map(r=>(
              <div key={r.id} className="rounded-2xl overflow-hidden" style={{background:'#1C1F28'}}>
                {/* Recipe header */}
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={()=>setExpandedRecipe(expandedRecipe===r.id ? null : r.id)}>
                  <span className="text-3xl flex-shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-display font-bold text-base leading-tight">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-md font-mono text-xs" style={{background:'#CEFF3C20',color:'#CEFF3C'}}>{r.tag}</span>
                      <span className="text-gray-600 text-xs font-mono">⏱ {r.time} min</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-volt font-display font-bold text-lg">{r.cal}</p>
                    <p className="text-gray-600 text-xs font-mono">kcal</p>
                  </div>
                </button>

                {/* Macros row */}
                <div className="flex gap-3 px-4 pb-3 border-b border-gray-800">
                  {[{l:'Prot',v:`${r.prot}g`,c:'#E23A2E'},{l:'Carbs',v:`${r.carbs}g`,c:'#6FD3E8'},{l:'Grasas',v:`${r.fat}g`,c:'#DE782C'}].map(m=>(
                    <div key={m.l} className="flex items-center gap-1">
                      <p className="font-mono font-bold text-sm" style={{color:m.c}}>{m.v}</p>
                      <p className="text-gray-600 text-xs font-mono">{m.l}</p>
                    </div>
                  ))}
                </div>

                {/* Expanded detail */}
                {expandedRecipe === r.id && (
                  <div className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Ingredientes</p>
                    <div className="space-y-1 mb-4">
                      {r.ingredients.map((ing,i)=>(
                        <div key={i} className="flex items-center justify-between">
                          <p className="text-white text-sm font-body">{ing.name}</p>
                          <p className="text-gray-500 text-xs font-mono">{ing.amount}</p>
                        </div>
                      ))}
                    </div>
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Preparación</p>
                    <div className="space-y-2">
                      {r.steps.map((s,i)=>(
                        <div key={i} className="flex gap-2">
                          <span className="font-mono text-xs font-bold flex-shrink-0 mt-0.5" style={{color:'#CEFF3C'}}>{i+1}.</span>
                          <p className="text-gray-400 text-sm font-body leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add button */}
                <div className="px-4 pb-3 pt-2 flex gap-2">
                  <button onClick={()=>setExpandedRecipe(expandedRecipe===r.id?null:r.id)}
                    className="flex-1 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest bg-gray-800 text-gray-400">
                    {expandedRecipe===r.id?'Cerrar':'Ver receta'}
                  </button>
                  <button onClick={()=>{ setSelected({source:'recipe',item:r}); setGrams('1') }}
                    className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm uppercase"
                    style={{background:'#CEFF3C',color:'#111318'}}>
                    + Registrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── SCAN tab ── */}
      {tab === 'scan' && (
        <div className="flex-1 px-4 pb-4 flex flex-col gap-4 pt-2">
          {/* Barcode */}
          <button onClick={()=>setScanState('scanning')}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left active:scale-95 transition-transform"
            style={{borderColor:'#CEFF3C33',background:'#1C1F28'}}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:'#CEFF3C15'}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CEFF3C" strokeWidth="2" strokeLinecap="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                <rect x="7" y="7" width="10" height="10" rx="1"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-display font-bold text-base">Código de barras</p>
              <p className="text-gray-500 text-xs font-body mt-0.5">Escanea cualquier producto del supermercado</p>
              <p className="text-volt text-xs font-mono mt-1">Disponible ✓</p>
            </div>
            <svg className="ml-auto text-gray-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {/* Plate photo */}
          <div className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left opacity-60"
            style={{borderColor:'#6FD3E833',background:'#1C1F28'}}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:'#6FD3E815'}}>
              📸
            </div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base">Foto del plato</p>
              <p className="text-gray-500 text-xs font-body mt-0.5">IA identifica automáticamente los alimentos</p>
              <p className="text-gray-600 text-xs font-mono mt-1">Próximamente — requiere IA conectada</p>
            </div>
          </div>

          {/* Product label */}
          <div className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left opacity-60"
            style={{borderColor:'#DE782C33',background:'#1C1F28'}}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl" style={{background:'#DE782C15'}}>
              🏷️
            </div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base">Etiqueta nutricional</p>
              <p className="text-gray-500 text-xs font-body mt-0.5">Fotografía la tabla de información nutricional</p>
              <p className="text-gray-600 text-xs font-mono mt-1">Próximamente — requiere IA conectada</p>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-gray-900 text-center">
            <p className="text-gray-600 text-xs font-body">
              La identificación automática por foto se activa cuando conectemos Supabase + Anthropic Vision.
              Por ahora usa código de barras o busca por nombre.
            </p>
          </div>
        </div>
      )}

      {/* ── Today's log ── */}
      {todayLog.length > 0 && !showModal && (
        <div className="px-4 pb-8 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Registro de hoy</p>
            <p className="font-mono text-xs text-volt">{Math.round(totals.cal)} kcal</p>
          </div>
          {MEAL_ORDER.filter(m=>todayLog.some(e=>e.mealType===m)).map(meal=>(
            <div key={meal} className="mb-2">
              <p className="text-gray-600 text-xs font-mono uppercase tracking-widest mb-1">{MEAL_ICONS[meal]} {MEAL_LABELS[meal]}</p>
              {todayLog.filter(e=>e.mealType===meal).map(e=>(
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-800/40">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-white text-sm font-body truncate">{e.name}</p>
                    <p className="text-gray-600 text-xs font-mono">{e.grams > 1 ? `${e.grams}g · ` : ''}{e.prot}g prot</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-volt font-mono font-bold text-sm">{e.cal} kcal</p>
                    <button onClick={()=>removeFood(e.id)} className="text-gray-700 hover:text-red-500 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
