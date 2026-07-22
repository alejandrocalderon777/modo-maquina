import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { LINEAGES } from '../assets/data'
import { FOODS, type FoodItem } from '../assets/foods'
import { lookupBarcode, searchOFF, type OFFProduct } from '../utils/openFoodFacts'
import { RECIPES, filterRecipes, type Recipe } from '../assets/recipes'
import type { MealType, FoodEntry } from '../types'

const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))
import { analyzePlate, generateRecipe, lookupFoodAI, generateMealPlan, restaurantAdvisor, type AIFood, type RestaurantAdvice } from '../lib/supabase'
import { PlateCamera } from '../components/PlateCamera'
import { DRINKS } from '../assets/drinks'
import { NutriVerdict } from '../components/NutriVerdict'
import { computeVerdict, verdictFromOFF } from '../utils/nutriScore'

const MEAL_LABELS: Record<MealType, string> = { breakfast:'Desayuno', lunch:'Almuerzo', dinner:'Cena', snack:'Snack' }
const MEAL_ICONS: Record<MealType, string>  = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'⚡' }
const MEAL_ORDER: MealType[] = ['breakfast','lunch','dinner','snack']
const getToday = () => new Date().toISOString().split('T')[0]

const CATEGORY_ORDER = ['Proteínas','Carbohidratos','Verduras','Frutas','Grasas','Lácteos','Platos']
const CATEGORY_ICONS: Record<string,string> = {
  'Proteínas':'🥩','Carbohidratos':'🍚','Verduras':'🥦','Frutas':'🍎','Grasas':'🥑','Lácteos':'🥛','Platos':'🍽️'
}
const RECIPE_CATS = ['Todos','Desayuno','Almuerzo','Cena','Snack']

type ActiveCard = 'none' | 'foods' | 'recipes' | 'scan' | 'plate' | 'label' | 'mealplan' | 'restaurant' | 'alcohol'
type ScanState = 'idle' | 'scanning' | 'loading' | 'confirm' | 'notfound'
type SelectedFood = { source: 'db'; item: FoodItem } | { source: 'barcode'; item: OFFProduct } | { source: 'recipe'; item: Recipe }

export default function FoodLog() {
  const navigate = useNavigate()
  const { foodLog, addFood, removeFood, profile } = useAppStore()
  const macros            = useAppStore((s) => s.macros)
  const mealPlan          = useAppStore((s) => s.mealPlan)
  const shoppingChecked   = useAppStore((s) => s.shoppingChecked)
  const setMealPlan       = useAppStore((s) => s.setMealPlan)
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem)
  const cheatMeals        = useAppStore((s) => s.cheatMeals)
  const addCheatMeal      = useAppStore((s) => s.addCheatMeal)
  const removeCheatMeal   = useAppStore((s) => s.removeCheatMeal)
  const [planGenerating, setPlanGenerating] = useState(false)
  const [planError, setPlanError] = useState('')
  const [planTab, setPlanTab] = useState<'plan'|'lista'>('plan')
  const lineage = LINEAGES.find(l => l.id === profile.lineage)
  const accentColor = lineage?.color || '#CEFF3C'
  const [activeCard, setActiveCard] = useState<ActiveCard>('none')
  const [query, setQuery] = useState('')
  const [onlineResults, setOnlineResults] = useState<OFFProduct[]>([])
  const [onlineSearching, setOnlineSearching] = useState(false)
  const [aiFoods, setAiFoods] = useState<AIFood[]>([])
  const [aiFoodSearching, setAiFoodSearching] = useState(false)
  const [activeMeal, setActiveMeal] = useState<MealType>('lunch')
  const [selected, setSelected] = useState<SelectedFood | null>(null)
  const [grams, setGrams] = useState('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scannedCode, setScannedCode] = useState('')
  const [recipeCat, setRecipeCat] = useState('Todos')
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiRecipe, setAiRecipe] = useState<Recipe | null>(null)
  const [aiError, setAiError] = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [added, setAdded] = useState<string | null>(null)

  // ── Plate photo state ────────────────────────────────────────
  type PlateState = 'idle' | 'capturing' | 'analyzing' | 'results' | 'error'
  const [plateState, setPlateState] = useState<PlateState>('idle')
  const [plateError, setPlateError] = useState('')
  const [plateGrams, setPlateGrams] = useState<Record<number,string>>({})

  const [plateResults, setPlateResults] = useState<{
    alimentos: { nombre:string; gramos:number; calorias:number; proteinas:number; carbohidratos:number; grasas:number }[]
    totalCalorias:number; totalProteinas:number; totalCarbohidratos:number; totalGrasas:number
  } | null>(null)
  const openPlateCamera = async (mode: 'plate' | 'label') => {
    setActiveCard(mode)
    setPlateState('capturing')
    setPlateResults(null)
    setPlateError('')
  }

  const runPlateAnalysis = async (base64: string, mimeType: string, mode: 'plate' | 'label') => {
    setPlateState('analyzing')
    try {
      const result = await analyzePlate(base64, mimeType, mode)
      if (result?.error) {
        setPlateError(result.error)
        setPlateState('error')
      } else {
        setPlateResults(result)
        const initGrams: Record<number,string> = {}
        result.alimentos?.forEach((a: {gramos:number}, i: number) => { initGrams[i] = String(a.gramos) })
        setPlateGrams(initGrams)
        setPlateState('results')
      }
    } catch {
      setPlateError('Error al analizar la imagen. Intenta de nuevo.')
      setPlateState('error')
    }
  }

  const capturePlate = async (videoEl: HTMLVideoElement, mode: 'plate' | 'label') => {
    const canvas = document.createElement('canvas')
    canvas.width  = videoEl.videoWidth || 1280
    canvas.height = videoEl.videoHeight || 720
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64  = dataUrl.split(',')[1]
    // stop camera
    if (videoEl.srcObject) (videoEl.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    await runPlateAnalysis(base64, 'image/jpeg', mode)
  }

  const capturePlateFile = async (base64: string, mimeType: string, mode: 'plate' | 'label') => {
    await runPlateAnalysis(base64, mimeType, mode)
  }

  const addPlateToLog = () => {
    if (!plateResults) return
    plateResults.alimentos.forEach((a, idx) => {
      const editedG = parseFloat(plateGrams[idx] || String(a.gramos)) || a.gramos
      const ratio = editedG / (a.gramos || 1)
      addFood({
        id: `plate-${Date.now()}-${Math.random()}`,
        foodId: `plate-${a.nombre}`,
        name: a.nombre,
        grams: editedG,
        cal: Math.round(a.calorias * ratio),
        prot: Math.round(a.proteinas * ratio),
        carbs: Math.round(a.carbohidratos * ratio),
        fat: Math.round(a.grasas * ratio),
        mealType: activeMeal,
        date: today,
        timestamp: Date.now(),
      })
    })
    setActiveCard('none')
    setPlateState('idle')
    setPlateResults(null)
  }

  // ── Modo restaurante ──────────────────────────────────────────
  type RestoState = 'idle' | 'capturing' | 'analyzing' | 'results' | 'error'
  const [restoState, setRestoState] = useState<RestoState>('idle')
  const [restoAdvice, setRestoAdvice] = useState<RestaurantAdvice | null>(null)
  const [restoError, setRestoError] = useState('')

  const openRestaurant = () => { setActiveCard('restaurant'); setRestoState('capturing'); setRestoAdvice(null); setRestoError('') }

  const runRestaurant = async (base64: string, mimeType: string) => {
    setRestoState('analyzing')
    try {
      const goalMap: Record<string,string> = { lose_weight:'Bajar de peso', gain_muscle:'Ganar músculo', health:'Salud general' }
      const m = useAppStore.getState().macros
      const remaining = {
        cal: Math.max(0, m.calories.target - m.calories.consumed),
        prot: Math.max(0, m.protein.target - m.protein.consumed),
        carbs: Math.max(0, m.carbs.target - m.carbs.consumed),
        fat: Math.max(0, m.fat.target - m.fat.consumed),
      }
      const res = await restaurantAdvisor({
        imageBase64: base64, mimeType,
        goal: profile.goal ? goalMap[profile.goal] : undefined,
        remaining,
      })
      setRestoAdvice(res)
      setRestoState('results')
    } catch {
      setRestoError('No se pudo analizar. Intenta de nuevo.')
      setRestoState('error')
    }
  }
  const captureResto = async (videoEl: HTMLVideoElement) => {
    const canvas = document.createElement('canvas')
    canvas.width = videoEl.videoWidth || 1280
    canvas.height = videoEl.videoHeight || 720
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0)
    const b64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    if (videoEl.srcObject) (videoEl.srcObject as MediaStream).getTracks().forEach(t => t.stop())
    await runRestaurant(b64, 'image/jpeg')
  }

  const today = getToday()
  const todayLog = foodLog.filter(e => e.date === today)
  const totals = todayLog.reduce((a,e) => ({ cal:a.cal+e.cal, prot:a.prot+e.prot, carbs:a.carbs+e.carbs, fat:a.fat+e.fat }), {cal:0,prot:0,carbs:0,fat:0})

  // ── Grouped foods ───────────────────────────────────────────
  const groupedFoods = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Token-based: every word in query must appear in name or category
    const words = q.split(/\s+/).filter(Boolean)
    const filtered = q
      ? FOODS.filter(f => {
          const hay = (f.name + ' ' + f.category).toLowerCase()
          return words.every(w => hay.includes(w))
        })
      : FOODS
    const groups: Record<string, FoodItem[]> = {}
    for (const f of filtered) {
      if (!groups[f.category]) groups[f.category] = []
      groups[f.category].push(f)
    }
    return CATEGORY_ORDER.filter(c => groups[c]).map(c => ({ category: c, items: groups[c] }))
  }, [query])

  const recipes = useMemo(() => filterRecipes(query, recipeCat === 'Todos' ? undefined : recipeCat), [query, recipeCat])

  // ── Online food search (Open Food Facts) — supermarket database ──
  useEffect(() => {
    const q = query.trim()
    if (activeCard !== 'foods' || q.length < 3) {
      setOnlineResults([])
      setOnlineSearching(false)
      return
    }
    setOnlineSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res = await searchOFF(q)
        setOnlineResults(res)
      } catch {
        setOnlineResults([])
      } finally {
        setOnlineSearching(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query, activeCard])

  // Reset AI foods when query changes
  useEffect(() => { setAiFoods([]) }, [query])

  const addDrink = (drink: typeof DRINKS[number]) => {
    addFood({
      id: `drink-${Date.now()}-${Math.random()}`,
      foodId: `alcohol-${drink.id}`,
      name: drink.name,
      grams: 0,
      cal: drink.cal,
      prot: 0,
      carbs: drink.carbs,
      fat: 0,
      mealType: 'snack',
      date: today,
      timestamp: Date.now(),
      kind: 'alcohol',
    })
    setActiveCard('none')
  }

  // Comidas libres esta semana (últimos 7 días)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const cheatsThisWeek = (cheatMeals || []).filter(d => new Date(d) >= weekAgo)
  const CHEAT_ALLOWANCE = 4  // ~20% de 21 comidas semanales

  const handleGenerateMealPlan = async () => {
    setPlanGenerating(true)
    setPlanError('')
    try {
      const goalMap: Record<string,string> = { lose_weight:'Bajar de peso', gain_muscle:'Ganar músculo', health:'Salud general' }
      const plan = await generateMealPlan({
        goal: profile.goal ? goalMap[profile.goal] : undefined,
        calories: macros.calories.target,
        protein: macros.protein.target,
        carbs: macros.carbs.target,
        fat: macros.fat.target,
      })
      setMealPlan(plan)
    } catch {
      setPlanError('No se pudo generar el plan. Intenta de nuevo.')
    } finally {
      setPlanGenerating(false)
    }
  }

  const handleAIFoodSearch = async () => {
    setAiFoodSearching(true)
    try {
      const res = await lookupFoodAI(query.trim())
      setAiFoods(res)
    } catch {
      setAiFoods([])
    } finally {
      setAiFoodSearching(false)
    }
  }

  const handleGenerateRecipe = async () => {
    setAiGenerating(true)
    setAiError('')
    setAiRecipe(null)
    try {
      const goalMap: Record<string, string> = {
        lose_weight: 'Bajar de peso', gain_muscle: 'Ganar músculo', health: 'Salud general'
      }
      const g = await generateRecipe({
        prompt: aiPrompt.trim() || undefined,
        goal: profile.goal ? goalMap[profile.goal] : undefined,
      })
      setAiRecipe({ ...g, id: `ai-${Date.now()}` })
    } catch {
      setAiError('No se pudo generar la receta. Intenta de nuevo.')
    } finally {
      setAiGenerating(false)
    }
  }

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
  // ── Nutritional verdict for the selected item ──────────────
  const selectedVerdict = (() => {
    if (!selected) return null
    if (selected.source === 'barcode') {
      const p = selected.item as OFFProduct
      const input = { cal:p.cal, prot:p.prot, carbs:p.carbs, fat:p.fat,
                      sugar:p.sugar, satFat:p.satFat, salt:p.salt, fiber:p.fiber }
      return p.nutriscore ? verdictFromOFF(p.nutriscore, input) : computeVerdict(input)
    }
    if (selected.source === 'db') {
      const f = selected.item as FoodItem
      return computeVerdict({ cal:f.cal, prot:f.prot, carbs:f.carbs, fat:f.fat })
    }
    const r = selected.item as Recipe
    // recipe macros are per portion; normalise to 100g using a 350g plate assumption
    const k = 100 / 350
    return computeVerdict({ cal:r.cal*k, prot:r.prot*k, carbs:r.carbs*k, fat:r.fat*k })
  })()

  const coachVerdictLine = (() => {
    if (!selectedVerdict) return undefined
    const n = profile.name?.split(' ')[0] || ''
    switch (selectedVerdict.grade) {
      case 'A': return `Excelente elección${n ? ', ' + n : ''}. Esto suma directo a tu objetivo.`
      case 'B': return 'Buena opción. Entra sin problema en tu día.'
      case 'C': return 'Aceptable. Equilíbralo con verduras o proteína magra en la próxima comida.'
      case 'D': return 'Bajo puntaje. Cuida la porción y compénsalo con algo más limpio después.'
      case 'E': return 'Muy bajo puntaje. Si puedes, busca una alternativa con menos azúcar y sodio.'
    }
  })()

  const showModal = scanState === 'confirm' || scanState === 'loading' || scanState === 'notfound' ||
    (selected !== null && (selected.source === 'barcode' || selected.source === 'recipe'))

  return (
    <div className="min-h-screen bg-carbon flex flex-col pb-24">
      {/* Scanner overlay */}
      {scanState === 'scanning' && (
        <Suspense fallback={<div className="fixed inset-0 bg-carbon flex items-center justify-center z-50"><div className="text-volt font-mono animate-pulse">Iniciando cámara…</div></div>}>
          <BarcodeScanner onResult={c => { setScanState('idle'); handleBarcode(c) }} onClose={() => setScanState('idle')} />
        </Suspense>
      )}

      {/* ── Confirm / loading modal ── */}
      {showModal && (
        <div className="fixed inset-0 flex flex-col bg-carbon" style={{zIndex:60}}>
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
              <button onClick={() => { setScanState('idle'); setActiveCard('foods') }} className="w-full py-3.5 rounded-xl bg-gray-800 text-gray-300 font-display font-bold uppercase text-sm">Buscar por nombre</button>
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

              {/* Nutritional verdict */}
              {selectedVerdict && (
                <div className="px-4 pt-4">
                  <NutriVerdict verdict={selectedVerdict} coachLine={coachVerdictLine}
                    nova={selected.source === 'barcode' ? (selected.item as OFFProduct).nova : undefined} />
                </div>
              )}

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

      {/* ── Entry method cards ── */}
      <div className="px-4 pb-4 space-y-3 flex-1 overflow-y-auto">

        {/* ALIMENTOS card */}
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid', borderColor: activeCard==='foods' ? '#CEFF3C' : '#252933', background:'#1C1F28'}}>
          <button className="w-full flex items-center gap-4 p-4 text-left active:scale-95 transition-transform"
            onClick={()=>setActiveCard(activeCard==='foods'?'none':'foods')}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{background: activeCard==='foods' ? '#CEFF3C20' : '#252933'}}>
              🔍
            </div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base">Buscar alimento</p>
              <p className="text-gray-500 text-xs font-body mt-0.5">Base local + supermercado (millones de productos)</p>
              <p className="text-xs font-mono mt-1" style={{color:'#CEFF3C'}}>Disponible ✓</p>
            </div>
            <svg className="transition-transform flex-shrink-0" style={{transform: activeCard==='foods'?'rotate(90deg)':'rotate(0deg)'}}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {activeCard === 'foods' && (
            <div className="border-t border-gray-800 px-3 pb-3 pt-2">
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input type="text" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar…"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-body text-sm placeholder-gray-600 focus:outline-none focus:border-volt transition-colors" />
                {query && <button onClick={()=>setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs">✕</button>}
              </div>
              {groupedFoods.map(group => (
                <div key={group.category} className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className="text-base">{CATEGORY_ICONS[group.category]}</span>
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">{group.category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.items.map(food=>(
                      <button key={food.id}
                        onClick={()=>{ setSelected({source:'db',item:food}); setGrams(String(food.serving)); setScanState('confirm') }}
                        className="flex flex-col justify-between p-3 rounded-xl text-left active:scale-95 transition-transform"
                        style={{background:'#252933', border:'1px solid #2e3140'}}>
                        <p className="text-white font-body text-xs font-semibold leading-tight mb-2">{food.name}</p>
                        <div>
                          <p className="text-volt font-display font-black text-base">{Math.round(food.cal*food.serving/100)}<span className="text-xs font-mono text-gray-500 ml-1">kcal</span></p>
                          <p className="text-gray-600 text-xs font-mono">{food.serving}{food.unit} · {Math.round(food.prot*food.serving/100)}g P</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* ── Online supermarket results ── */}
              {query.trim().length >= 3 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <span className="text-base">🛒</span>
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Supermercado</p>
                    {onlineSearching && (
                      <span className="w-3 h-3 border-2 border-volt border-t-transparent rounded-full animate-spin ml-1"/>
                    )}
                  </div>

                  {!onlineSearching && onlineResults.length === 0 && (
                    <p className="text-gray-600 text-xs font-mono px-1 py-2">Sin resultados en línea. Prueba otro término.</p>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    {onlineResults.map((prod, i)=>(
                      <button key={`off-${i}`}
                        onClick={()=>{ setSelected({source:'barcode',item:prod}); setGrams(String(prod.serving)); setScanState('confirm') }}
                        className="flex flex-col justify-between p-3 rounded-xl text-left active:scale-95 transition-transform"
                        style={{background:'#252933', border:'1px solid #2e3140'}}>
                        <div className="flex items-start gap-2 mb-2">
                          {prod.image && (
                            <img src={prod.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-body text-xs font-semibold leading-tight">{prod.name}</p>
                            {prod.brand && <p className="text-gray-600 font-mono" style={{fontSize:'9px'}}>{prod.brand}</p>}
                          </div>
                        </div>
                        <div>
                          <p className="text-volt font-display font-black text-base">{Math.round(prod.cal*prod.serving/100)}<span className="text-xs font-mono text-gray-500 ml-1">kcal</span></p>
                          <p className="text-gray-600 text-xs font-mono mb-1">{prod.serving}{prod.unit} · {Math.round(prod.prot*prod.serving/100)}g P</p>
                          <NutriVerdict compact verdict={prod.nutriscore
                            ? verdictFromOFF(prod.nutriscore, { cal:prod.cal, prot:prod.prot, carbs:prod.carbs, fat:prod.fat, sugar:prod.sugar, satFat:prod.satFat, salt:prod.salt, fiber:prod.fiber })
                            : computeVerdict({ cal:prod.cal, prot:prod.prot, carbs:prod.carbs, fat:prod.fat, sugar:prod.sugar, satFat:prod.satFat, salt:prod.salt, fiber:prod.fiber })} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── AI food lookup ── */}
              {query.trim().length >= 2 && (
                <div className="mb-3">
                  {aiFoods.length === 0 && !aiFoodSearching && (
                    <button onClick={handleAIFoodSearch}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl active:scale-98 transition-transform"
                      style={{background:`linear-gradient(135deg, #6FD3E818, #CEFF3C10)`, border:'1px solid #6FD3E833'}}>
                      <span className="text-base">✨</span>
                      <span className="text-white font-display font-bold text-sm">Buscar "{query.trim()}" con IA</span>
                    </button>
                  )}

                  {aiFoodSearching && (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <span className="w-4 h-4 border-2 border-viking border-t-transparent rounded-full animate-spin"/>
                      <span className="font-mono text-xs" style={{color:'#6FD3E8'}}>Consultando IA nutricional…</span>
                    </div>
                  )}

                  {aiFoods.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5 mb-1.5 px-1">
                        <span className="text-base">✨</span>
                        <p className="font-mono text-xs uppercase tracking-widest" style={{color:'#6FD3E8'}}>Estimado por IA</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {aiFoods.map((f, i)=>(
                          <button key={`ai-${i}`}
                            onClick={()=>{
                              const prod: OFFProduct = {
                                name: f.nombre, brand: 'IA · por 100g',
                                cal: f.cal, prot: f.prot, carbs: f.carbs, fat: f.fat,
                                serving: 100, unit: f.unidad === 'ml' ? 'ml' : 'g',
                              }
                              setSelected({source:'barcode',item:prod}); setGrams('100'); setScanState('confirm')
                            }}
                            className="flex flex-col justify-between p-3 rounded-xl text-left active:scale-95 transition-transform"
                            style={{background:'#252933', border:'1px solid #6FD3E830'}}>
                            <p className="text-white font-body text-xs font-semibold leading-tight mb-2">{f.nombre}</p>
                            <div>
                              <p className="text-volt font-display font-black text-base">{f.cal}<span className="text-xs font-mono text-gray-500 ml-1">kcal</span></p>
                              <p className="text-gray-600 text-xs font-mono">100{f.unidad} · {f.prot}g P</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECETAS card */}
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid', borderColor: activeCard==='recipes' ? '#6FD3E8' : '#252933', background:'#1C1F28'}}>
          <button className="w-full flex items-center gap-4 p-4 text-left active:scale-95 transition-transform"
            onClick={()=>setActiveCard(activeCard==='recipes'?'none':'recipes')}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{background: activeCard==='recipes' ? '#6FD3E820' : '#252933'}}>
              👨‍🍳
            </div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base">Recetas saludables</p>
              <p className="text-gray-500 text-xs font-body mt-0.5">28 recetas + generador ✨ IA</p>
              <p className="text-xs font-mono mt-1" style={{color:'#6FD3E8'}}>Disponible ✓</p>
            </div>
            <svg className="transition-transform flex-shrink-0" style={{transform: activeCard==='recipes'?'rotate(90deg)':'rotate(0deg)'}}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {activeCard === 'recipes' && (
            <div className="border-t border-gray-800 px-3 pb-3 pt-2 space-y-2">
              {/* Category filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {RECIPE_CATS.map(cat=>(
                  <button key={cat} onClick={()=>setRecipeCat(cat)}
                    className="px-2.5 py-1 rounded-lg font-mono text-xs uppercase tracking-widest whitespace-nowrap flex-shrink-0 transition-all"
                    style={{background:recipeCat===cat?'#6FD3E8':'#252933',color:recipeCat===cat?'#111318':'#555',fontWeight:recipeCat===cat?700:400}}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* ── AI recipe generator toggle ── */}
              <button onClick={()=>setShowAiPanel(!showAiPanel)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl active:scale-98 transition-transform"
                style={{background:`linear-gradient(135deg, #6FD3E818, #CEFF3C10)`, border:'1px solid #6FD3E833'}}>
                <span className="text-lg">✨</span>
                <div className="flex-1 text-left">
                  <p className="text-white font-display font-bold text-sm">Generar receta con IA</p>
                  <p className="text-gray-500 font-mono" style={{fontSize:'10px'}}>Personalizada a tu objetivo</p>
                </div>
                <svg style={{transform: showAiPanel?'rotate(90deg)':'rotate(0)'}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6FD3E8" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              {showAiPanel && (
                <div className="rounded-xl p-3 space-y-2" style={{background:'#252933', border:'1px solid #2e3140'}}>
                  <input type="text" value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
                    placeholder="Ej: algo con pollo y palta, bajo en carbos…"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-body text-xs placeholder-gray-600 focus:outline-none focus:border-viking transition-colors" />
                  <button onClick={handleGenerateRecipe} disabled={aiGenerating}
                    className="w-full py-2.5 rounded-lg font-display font-bold text-sm flex items-center justify-center gap-2"
                    style={{background: aiGenerating ? '#6FD3E844' : '#6FD3E8', color:'#111318'}}>
                    {aiGenerating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-carbon border-t-transparent rounded-full animate-spin"/>
                        Generando…
                      </>
                    ) : '✨ Generar receta'}
                  </button>
                  {aiError && <p className="text-spartan text-xs font-mono text-center">{aiError}</p>}

                  {aiRecipe && (
                    <div className="rounded-xl overflow-hidden mt-2" style={{background:'#1C1F28', border:'1px solid #6FD3E833'}}>
                      <div className="flex items-center gap-3 px-3 py-3">
                        <span className="text-2xl flex-shrink-0">{aiRecipe.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-display font-bold text-sm leading-tight">{aiRecipe.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-volt font-mono text-xs font-bold">{aiRecipe.cal} kcal</span>
                            <span className="font-mono text-xs" style={{color:'#E23A2E'}}>{aiRecipe.prot}g P</span>
                            <span className="font-mono text-xs" style={{color:'#6FD3E8'}}>{aiRecipe.carbs}g C</span>
                            <span className="text-gray-500 text-xs font-mono">⏱{aiRecipe.time}m</span>
                          </div>
                        </div>
                        <button onClick={()=>{ setSelected({source:'recipe',item:aiRecipe}); setGrams('1') }}
                          className="px-3 py-1.5 rounded-lg font-display font-bold text-xs uppercase flex-shrink-0"
                          style={{background:'#6FD3E820',color:'#6FD3E8',border:'1px solid #6FD3E830'}}>
                          + Agregar
                        </button>
                      </div>
                      <div className="px-3 pb-3 space-y-3 border-t border-gray-800 pt-2">
                        <div>
                          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Ingredientes</p>
                          {aiRecipe.ingredients.map((ing,i)=>(
                            <div key={i} className="flex justify-between py-0.5">
                              <p className="text-white text-xs font-body">{ing.name}</p>
                              <p className="text-gray-500 text-xs font-mono">{ing.amount}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Preparación</p>
                          {aiRecipe.steps.map((s,i)=>(
                            <div key={i} className="flex gap-2 mb-1">
                              <span className="font-mono text-xs font-bold flex-shrink-0" style={{color:'#6FD3E8'}}>{i+1}.</span>
                              <p className="text-gray-400 text-xs font-body leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                        <button onClick={handleGenerateRecipe} className="w-full py-2 rounded-lg font-mono text-xs" style={{background:'#252933', color:'#6FD3E8'}}>
                          🔄 Generar otra
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {recipes.map(r=>(
                <div key={r.id} className="rounded-xl overflow-hidden" style={{background:'#252933'}}>
                  <div className="flex items-center gap-3 px-3 py-3">
                    <span className="text-2xl flex-shrink-0">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-display font-bold text-sm leading-tight">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-volt font-mono text-xs font-bold">{r.cal} kcal</span>
                        <span className="text-gray-600 text-xs font-mono">·</span>
                        <span className="font-mono text-xs" style={{color:'#E23A2E'}}>{r.prot}g P</span>
                        <span className="font-mono text-xs" style={{color:'#6FD3E8'}}>{r.carbs}g C</span>
                        <span className="text-gray-600 text-xs font-mono">·</span>
                        <span className="text-gray-500 text-xs font-mono">⏱{r.time}m</span>
                      </div>
                    </div>
                    <button onClick={()=>{ setSelected({source:'recipe',item:r}); setGrams('1') }}
                      className="px-3 py-1.5 rounded-lg font-display font-bold text-xs uppercase flex-shrink-0"
                      style={{background:'#6FD3E820',color:'#6FD3E8',border:'1px solid #6FD3E830'}}>
                      + Agregar
                    </button>
                  </div>
                  <button className="w-full text-left px-3 pb-2" onClick={()=>setExpandedRecipe(expandedRecipe===r.id?null:r.id)}>
                    <p className="text-gray-600 text-xs font-mono">{expandedRecipe===r.id ? '▲ ocultar receta' : '▼ ver receta'}</p>
                  </button>
                  {expandedRecipe === r.id && (
                    <div className="px-3 pb-3 space-y-3 border-t border-gray-800 pt-2">
                      <div>
                        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Ingredientes</p>
                        {r.ingredients.map((ing,i)=>(
                          <div key={i} className="flex justify-between py-0.5">
                            <p className="text-white text-xs font-body">{ing.name}</p>
                            <p className="text-gray-500 text-xs font-mono">{ing.amount}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Preparación</p>
                        {r.steps.map((s,i)=>(
                          <div key={i} className="flex gap-2 mb-1">
                            <span className="font-mono text-xs font-bold flex-shrink-0" style={{color:'#6FD3E8'}}>{i+1}.</span>
                            <p className="text-gray-400 text-xs font-body leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PLAN SEMANAL card */}
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid', borderColor: activeCard==='mealplan' ? '#DE782C' : '#252933', background:'#1C1F28'}}>
          <button className="w-full flex items-center gap-4 p-4 text-left active:scale-95 transition-transform"
            onClick={()=>setActiveCard(activeCard==='mealplan'?'none':'mealplan')}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{background: activeCard==='mealplan' ? '#DE782C20' : '#252933'}}>🗓️</div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base">Plan semanal <span className="ml-1">✨</span></p>
              <p className="text-gray-500 text-xs font-body mt-0.5">Menú de 7 días + lista de supermercado</p>
              <p className="text-xs font-mono mt-1" style={{color:'#DE782C'}}>{mealPlan ? 'Plan activo ✓' : 'Genera con IA'}</p>
            </div>
            <svg className="transition-transform flex-shrink-0" style={{transform: activeCard==='mealplan'?'rotate(90deg)':'rotate(0deg)'}}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          {activeCard === 'mealplan' && (
            <div className="border-t border-gray-800 px-3 pb-3 pt-3">
              {!mealPlan ? (
                <>
                  <button onClick={handleGenerateMealPlan} disabled={planGenerating}
                    className="w-full py-3 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2"
                    style={{background: planGenerating ? '#DE782C44' : '#DE782C', color:'#111318'}}>
                    {planGenerating
                      ? <><span className="w-3.5 h-3.5 border-2 border-carbon border-t-transparent rounded-full animate-spin"/> Generando 7 días…</>
                      : '✨ Generar plan semanal'}
                  </button>
                  {planError && <p className="text-spartan text-xs font-mono text-center mt-2">{planError}</p>}
                  <p className="text-gray-600 text-xs font-body text-center mt-2 leading-relaxed">
                    Según tu objetivo y macros. Incluye desayuno, almuerzo, cena y snack para cada día.
                  </p>
                </>
              ) : (
                <>
                  {/* Tabs plan / lista */}
                  <div className="flex gap-2 mb-3 p-1 rounded-xl" style={{background:'#252933'}}>
                    {([['plan','📋 Menú'],['lista','🛒 Lista']] as const).map(([t,label])=>(
                      <button key={t} onClick={()=>setPlanTab(t)}
                        className="flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-widest"
                        style={{background: planTab===t ? '#DE782C':'transparent', color: planTab===t ? '#111318':'#666'}}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {planTab === 'plan' ? (
                    <div className="space-y-2">
                      {mealPlan.dias.map((d, i) => (
                        <div key={i} className="rounded-xl p-3" style={{background:'#252933'}}>
                          <p className="font-display font-bold text-sm text-white mb-2">{d.dia}</p>
                          <div className="space-y-1">
                            {Object.entries(d.comidas).map(([meal, info]) => (
                              <div key={meal} className="flex items-center gap-2">
                                <span className="text-sm">{meal==='desayuno'?'🌅':meal==='almuerzo'?'☀️':meal==='cena'?'🌙':'⚡'}</span>
                                <p className="flex-1 text-gray-300 text-xs font-body">{info.nombre}</p>
                                <span className="font-mono text-xs" style={{color:'#DE782C'}}>{info.kcal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mealPlan.listaSupermercado.map((cat, i) => (
                        <div key={i}>
                          <p className="font-mono text-xs uppercase tracking-widest mb-1.5" style={{color:'#DE782C'}}>{cat.categoria}</p>
                          {cat.items.map((item, j) => {
                            const checked = shoppingChecked.includes(item)
                            return (
                              <button key={j} onClick={()=>toggleShoppingItem(item)}
                                className="w-full flex items-center gap-2 py-1.5 text-left">
                                <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                                  style={{borderColor: checked ? '#DE782C':'#444', background: checked ? '#DE782C':'transparent'}}>
                                  {checked && <span className="text-carbon" style={{fontSize:'9px'}}>✓</span>}
                                </div>
                                <p className={`flex-1 text-xs font-body ${checked ? 'line-through text-gray-600':'text-white'}`}>{item}</p>
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleGenerateMealPlan} disabled={planGenerating}
                    className="w-full mt-3 py-2 rounded-lg font-mono text-xs" style={{background:'#252933', color:'#DE782C'}}>
                    {planGenerating ? 'Generando…' : '🔄 Generar otro plan'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* MODO RESTAURANTE card */}
        <button onClick={openRestaurant}
          className="flex items-center gap-4 p-4 rounded-2xl w-full text-left active:scale-98 transition-transform"
          style={{background:'#1C1F28', border:'1px solid #6FD3E833'}}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{background:'#6FD3E820'}}>🍴</div>
          <div className="flex-1">
            <p className="text-white font-display font-bold text-base">Modo restaurante <span className="ml-1">✨</span></p>
            <p className="text-gray-400 text-xs font-body mt-0.5">Foto al menú o plato → qué pedir y cuánto comer</p>
            <p className="font-mono text-xs mt-1" style={{color:'#6FD3E8'}}>✨ Claude Vision · activo ✓</p>
          </div>
        </button>

        {/* ALCOHOL card */}
        <div className="rounded-2xl overflow-hidden" style={{border:'1px solid', borderColor: activeCard==='alcohol' ? '#DE782C' : '#252933', background:'#1C1F28'}}>
          <button className="w-full flex items-center gap-4 p-4 text-left active:scale-95 transition-transform"
            onClick={()=>setActiveCard(activeCard==='alcohol'?'none':'alcohol')}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{background: activeCard==='alcohol' ? '#DE782C20' : '#252933'}}>🍺</div>
            <div className="flex-1">
              <p className="text-white font-display font-bold text-base">Registrar bebida</p>
              <p className="text-gray-500 text-xs font-body mt-0.5">Alcohol sin culpa — mejor visibilizarlo que ignorarlo</p>
              <p className="text-xs font-mono mt-1" style={{color:'#DE782C'}}>Disponible ✓</p>
            </div>
            <svg className="transition-transform flex-shrink-0" style={{transform: activeCard==='alcohol'?'rotate(90deg)':'rotate(0deg)'}}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          {activeCard === 'alcohol' && (
            <div className="border-t border-gray-800 px-3 pb-3 pt-3">
              <div className="grid grid-cols-2 gap-1.5">
                {DRINKS.map(d => (
                  <button key={d.id} onClick={()=>addDrink(d)}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-left active:scale-95 transition-transform"
                    style={{background:'#252933', border:'1px solid #2e3140'}}>
                    <span className="text-xl flex-shrink-0">{d.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-body text-xs font-semibold leading-tight">{d.name}</p>
                      <p className="text-gray-600 font-mono" style={{fontSize:'9px'}}>{d.serving}</p>
                    </div>
                    <span className="font-mono text-xs" style={{color:'#DE782C'}}>{d.cal}</span>
                  </button>
                ))}
              </div>
              <p className="text-gray-600 text-xs font-body text-center mt-3 leading-relaxed">
                El alcohol suma calorías y afecta tu recuperación. Registrarlo te da la foto real, sin juzgarte.
              </p>
            </div>
          )}
        </div>

        {/* FLEXIBILIDAD 80/20 card */}
        <div className="rounded-2xl p-4" style={{background:'#1C1F28', border:'1px solid #252933'}}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-white font-display font-bold text-base">Flexibilidad 80/20</p>
                <p className="text-gray-500 text-xs font-body">Comidas libres que protegen tu racha</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({length: CHEAT_ALLOWANCE}).map((_, i) => (
              <div key={i} className="flex-1 h-2 rounded-full" style={{background: i < cheatsThisWeek.length ? '#DE782C' : '#252933'}} />
            ))}
          </div>
          <p className="font-mono text-xs mb-3" style={{color: cheatsThisWeek.length >= CHEAT_ALLOWANCE ? '#E23A2E' : '#6FD3E8'}}>
            {cheatsThisWeek.length}/{CHEAT_ALLOWANCE} comidas libres esta semana
            {cheatsThisWeek.length >= CHEAT_ALLOWANCE && ' · llegaste al límite, vuelve al 80%'}
          </p>
          <button onClick={addCheatMeal} disabled={cheatsThisWeek.length >= CHEAT_ALLOWANCE}
            className="w-full py-2.5 rounded-xl font-display font-bold text-sm disabled:opacity-40"
            style={{background: cheatsThisWeek.length >= CHEAT_ALLOWANCE ? '#252933' : '#DE782C22', color:'#DE782C', border:'1px solid #DE782C44'}}>
            + Registrar comida libre
          </button>
          {cheatsThisWeek.length > 0 && (
            <button onClick={()=>removeCheatMeal(cheatsThisWeek[cheatsThisWeek.length-1])}
              className="w-full py-1.5 font-mono text-xs text-gray-600 mt-1">deshacer última</button>
          )}
          <p className="text-gray-600 text-xs font-body text-center mt-2 leading-relaxed">
            80% alineado a tu objetivo, 20% libre. Una comida trampa programada no rompe el progreso — lo sostiene.
          </p>
        </div>

        {/* BARCODE card */}
        <button className="w-full flex items-center gap-4 p-4 rounded-2xl text-left active:scale-95 transition-transform"
          style={{background:'#1C1F28', border:'1px solid #252933'}}
          onClick={()=>setScanState('scanning')}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{background:'#CEFF3C15', border:'1px solid #CEFF3C20'}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#CEFF3C" strokeWidth="2" strokeLinecap="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-display font-bold text-base">Código de barras</p>
            <p className="text-gray-500 text-xs font-body mt-0.5">Escanea cualquier producto del supermercado</p>
            <p className="text-volt text-xs font-mono mt-1">Disponible ✓</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        {/* PLATE PHOTO card */}
        <button onClick={() => openPlateCamera('plate')}
          className="flex items-center gap-4 p-4 rounded-2xl w-full text-left active:scale-98 transition-transform"
          style={{background:'#1C1F28', border:`1px solid #6FD3E833`}}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{background:'#6FD3E820'}}>
            📸
          </div>
          <div className="flex-1">
            <p className="text-white font-display font-bold text-base">Foto del plato <span className="ml-1">✨</span></p>
            <p className="text-gray-400 text-xs font-body mt-0.5">IA identifica automáticamente los alimentos</p>
            <p className="font-mono text-xs mt-1" style={{color:'#6FD3E8'}}>✨ Claude Vision · activo ✓</p>
          </div>
        </button>

        {/* LABEL card */}
        <button onClick={() => openPlateCamera('label')}
          className="flex items-center gap-4 p-4 rounded-2xl w-full text-left active:scale-98 transition-transform"
          style={{background:'#1C1F28', border:`1px solid #DE782C33`}}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{background:'#DE782C20'}}>
            🏷️
          </div>
          <div className="flex-1">
            <p className="text-white font-display font-bold text-base">Etiqueta nutricional <span className="ml-1">✨</span></p>
            <p className="text-gray-400 text-xs font-body mt-0.5">Fotografía la tabla de información nutricional</p>
            <p className="font-mono text-xs mt-1" style={{color:'#DE782C'}}>✨ Claude Vision · activo ✓</p>
          </div>
        </button>

        {/* ── PLATE CAMERA MODAL ── */}
        {/* ── MODO RESTAURANTE MODAL ── */}
        {activeCard === 'restaurant' && (
          <div className="fixed inset-0 flex flex-col" style={{background:'#111318', zIndex:60}}>
            <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3" style={{borderBottom:'1px solid #1C1F28'}}>
              <button onClick={() => { setActiveCard('none'); setRestoState('idle') }} className="text-gray-500 font-mono text-sm">← Cancelar</button>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Modo restaurante</p>
              <div className="w-16"/>
            </div>

            {restoState === 'capturing' && (
              <PlateCamera
                onCapture={captureResto}
                onCaptureFile={(b64, mt) => runRestaurant(b64, mt)}
                accentColor="#6FD3E8"
                mode="plate"
              />
            )}

            {restoState === 'analyzing' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'#6FD3E844', borderTopColor:'transparent'}}/>
                <p className="font-mono text-sm" style={{color:'#6FD3E8'}}>✨ Analizando el menú…</p>
                <p className="font-mono text-xs text-gray-600">Cruzando con tus macros de hoy</p>
              </div>
            )}

            {restoState === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
                <p className="text-4xl">😕</p>
                <p className="text-white font-body text-center">{restoError}</p>
                <button onClick={openRestaurant} className="px-6 py-3 rounded-xl font-mono text-sm" style={{background:'#6FD3E8', color:'#111318'}}>Intentar de nuevo</button>
              </div>
            )}

            {restoState === 'results' && restoAdvice && (
              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
                {/* Consejo del coach */}
                <div className="rounded-2xl p-4 mb-4" style={{background:'linear-gradient(135deg, #6FD3E818, #6FD3E808)', border:'1px solid #6FD3E844'}}>
                  <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{color:'#6FD3E8'}}>Coach</p>
                  <p className="text-white text-sm font-body italic leading-relaxed">"{restoAdvice.consejo}"</p>
                </div>

                {restoAdvice.tipo === 'plato' && restoAdvice.macrosEstimados.cal > 0 && (
                  <div className="rounded-xl p-3 mb-4" style={{background:'#1C1F28'}}>
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Macros estimados del plato</p>
                    <div className="flex gap-4">
                      {[{l:'Kcal',v:restoAdvice.macrosEstimados.cal,c:'#CEFF3C'},{l:'Prot',v:restoAdvice.macrosEstimados.prot,c:'#E23A2E'},{l:'Carbs',v:restoAdvice.macrosEstimados.carbs,c:'#6FD3E8'},{l:'Grasas',v:restoAdvice.macrosEstimados.fat,c:'#DE782C'}].map(m=>(
                        <div key={m.l}><p className="font-mono font-bold" style={{color:m.c,fontSize:'15px'}}>{Math.round(m.v)}</p><p className="font-mono text-gray-600" style={{fontSize:'9px'}}>{m.l}</p></div>
                      ))}
                    </div>
                  </div>
                )}

                {restoAdvice.recomendaciones.length > 0 && (
                  <div className="mb-4">
                    <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{color:'#CEFF3C'}}>✓ Buenas opciones</p>
                    <div className="space-y-2">
                      {restoAdvice.recomendaciones.map((r,i)=>(
                        <div key={i} className="rounded-xl p-3" style={{background:'#1C1F28', border:'1px solid #CEFF3C22'}}>
                          <p className="text-white font-body text-sm font-medium">{r.opcion}</p>
                          <p className="text-gray-500 text-xs font-body mt-0.5">{r.razon}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {restoAdvice.evitar.length > 0 && (
                  <div className="mb-4">
                    <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{color:'#E23A2E'}}>✕ Mejor evitar</p>
                    <div className="space-y-2">
                      {restoAdvice.evitar.map((r,i)=>(
                        <div key={i} className="rounded-xl p-3" style={{background:'#1C1F28', border:'1px solid #E23A2E22'}}>
                          <p className="text-white font-body text-sm font-medium">{r.opcion}</p>
                          <p className="text-gray-500 text-xs font-body mt-0.5">{r.razon}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={openRestaurant} className="w-full py-3 rounded-xl font-mono text-xs" style={{background:'#1C1F28', color:'#6FD3E8'}}>🔄 Otra foto</button>
              </div>
            )}
          </div>
        )}

        {(activeCard === 'plate' || activeCard === 'label') && (
          <div className="fixed inset-0 flex flex-col" style={{background:'#111318', zIndex:60}}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3"
              style={{borderBottom:'1px solid #1C1F28'}}>
              <button onClick={() => { setActiveCard('none'); setPlateState('idle') }}
                className="text-gray-500 font-mono text-sm">← Cancelar</button>
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">
                {activeCard === 'plate' ? 'Foto del plato' : 'Etiqueta nutricional'}
              </p>
              <div className="w-16"/>
            </div>

            {/* CAPTURING */}
            {plateState === 'capturing' && (
              <PlateCamera
                onCapture={(v) => capturePlate(v, activeCard as 'plate'|'label')}
                onCaptureFile={(b64, mt) => capturePlateFile(b64, mt, activeCard as 'plate'|'label')}
                accentColor={accentColor}
                mode={activeCard as 'plate'|'label'}
              />
            )}

            {/* ANALYZING */}
            {plateState === 'analyzing' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
                  style={{borderColor:`${accentColor}44`, borderTopColor:'transparent'}}/>
                <p className="font-mono text-sm" style={{color:accentColor}}>✨ Analizando con Claude Vision…</p>
                <p className="font-mono text-xs text-gray-600">Identificando alimentos y macros</p>
              </div>
            )}

            {/* ERROR */}
            {plateState === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
                <p className="text-4xl">😕</p>
                <p className="text-white font-body text-center">{plateError}</p>
                <button onClick={() => openPlateCamera(activeCard as 'plate'|'label')}
                  className="px-6 py-3 rounded-xl font-mono text-sm"
                  style={{background:accentColor, color:'#111318'}}>Intentar de nuevo</button>
              </div>
            )}

            {/* RESULTS */}
            {plateState === 'results' && plateResults && (
              <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">✨ Detectado por IA</p>

                {/* Veredicto nutricional del plato completo */}
                {(() => {
                  const totalG = plateResults.alimentos.reduce((s, a, i) => {
                    const g = parseFloat(plateGrams[i] || String(a.gramos)) || a.gramos
                    return s + g
                  }, 0) || 100
                  const k = 100 / totalG
                  const v = computeVerdict({
                    cal: plateResults.totalCalorias * k,
                    prot: plateResults.totalProteinas * k,
                    carbs: plateResults.totalCarbohidratos * k,
                    fat: plateResults.totalGrasas * k,
                  })
                  const line = v.grade === 'A' || v.grade === 'B'
                    ? 'Buen plato. Así se construye el modo máquina.'
                    : v.grade === 'C'
                      ? 'Plato aceptable. Súmale verduras o baja la porción de lo más calórico.'
                      : 'Plato de bajo puntaje. Ajusta la porción o cámbialo por una versión más limpia.'
                  return <div className="mb-3"><NutriVerdict verdict={v} coachLine={line} /></div>
                })()}
                <div className="space-y-2 mb-4">
                  {plateResults.alimentos.map((a, i) => {
                    const g = parseFloat(plateGrams[i] || String(a.gramos)) || a.gramos
                    const r = g / (a.gramos || 1)
                    return (
                    <div key={i} className="rounded-xl p-3" style={{background:'#1C1F28'}}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-body text-sm font-medium flex-1 mr-2">{a.nombre}</p>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={plateGrams[i] ?? a.gramos}
                            onChange={e => setPlateGrams(prev => ({...prev, [i]: e.target.value}))}
                            className="w-16 text-right font-mono text-sm rounded-lg px-2 py-1"
                            style={{background:'#252933', color:'#fff', border:`1px solid ${accentColor}44`}}
                            min={1} max={2000}
                          />
                          <span className="font-mono text-xs text-gray-500">g</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {[
                          {l:'Kcal', v:a.calorias*r, c:accentColor},
                          {l:'Prot', v:a.proteinas*r, c:'#E23A2E'},
                          {l:'Carbs', v:a.carbohidratos*r, c:'#6FD3E8'},
                          {l:'Grasas', v:a.grasas*r, c:'#DE782C'},
                        ].map(m => (
                          <div key={m.l} className="text-center">
                            <p className="font-mono text-xs font-bold" style={{color:m.c}}>{Math.round(m.v)}</p>
                            <p className="font-mono text-gray-600" style={{fontSize:'9px'}}>{m.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    )
                  })}
                </div>
                {/* Total */}
                <div className="rounded-xl p-3 mb-4" style={{background:`${accentColor}15`, border:`1px solid ${accentColor}33`}}>
                  <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Total estimado</p>
                  <div className="flex gap-4">
                    {[
                      {l:'Calorías', v:plateResults.totalCalorias, c:accentColor},
                      {l:'Proteínas', v:plateResults.totalProteinas, c:'#E23A2E'},
                      {l:'Carbos', v:plateResults.totalCarbohidratos, c:'#6FD3E8'},
                      {l:'Grasas', v:plateResults.totalGrasas, c:'#DE782C'},
                    ].map(m => (
                      <div key={m.l}>
                        <p className="font-mono font-bold" style={{color:m.c, fontSize:'15px'}}>{Math.round(m.v)}</p>
                        <p className="font-mono text-gray-600" style={{fontSize:'9px'}}>{m.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Meal selector */}
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-2">Agregar a</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(Object.keys(MEAL_LABELS) as MealType[]).map(m => (
                    <button key={m} onClick={() => setActiveMeal(m)}
                      className="py-2 rounded-xl font-mono text-xs"
                      style={{
                        background: activeMeal === m ? accentColor : '#1C1F28',
                        color: activeMeal === m ? '#111318' : '#888'
                      }}>
                      <span className="block text-base">{MEAL_ICONS[m]}</span>
                      <span className="block" style={{fontSize:'9px'}}>{MEAL_LABELS[m]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            {plateState === 'results' && (
              <div className="fixed bottom-0 left-0 right-0 p-4" style={{background:'rgba(17,19,24,0.97)', zIndex:61, paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 16px)'}}>
                <button onClick={addPlateToLog}
                  className="w-full py-4 rounded-2xl font-display font-black text-lg"
                  style={{background:accentColor, color:'#111318'}}>
                  Agregar al registro
                </button>
              </div>
            )}
          </div>
        )}

      </div>

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

      {/* Nav bar — se oculta cuando hay cámara/modal a pantalla completa */}
      {!(activeCard === 'plate' || activeCard === 'label' || activeCard === 'restaurant' || showModal || scanState === 'scanning') && (
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 z-50"
        style={{ background:'rgba(17,19,24,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid #1C1F28' }}>
        {([
          { id:'home',     icon:'🏠', label:'Inicio',   path:'/dashboard' },
          { id:'workout',  icon:'🏋️', label:'Entrena',  path:'/dashboard' },
          { id:'food',     icon:'🍽️', label:'Comida',   path:'' },
          { id:'progress', icon:'📊', label:'Progreso', path:'/dashboard' },
          { id:'avatar',   icon:'⚡', label:'Avatar',   path:'/dashboard' },
        ]).map(tab => (
          <button key={tab.id}
            onClick={() => { if (tab.path) navigate(tab.path) }}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            style={{ color: tab.id === 'food' ? accentColor : '#555' }}>
            <span className="text-xl">{tab.icon}</span>
            <span className="font-mono text-xs">{tab.label}</span>
            {tab.id === 'food' && <div className="w-1 h-1 rounded-full" style={{ background: accentColor }} />}
          </button>
        ))}
      </nav>
      )}
    </div>
  )
}
