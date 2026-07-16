export interface Recipe {
  id: string
  name: string
  emoji: string
  tag: string         // 'Alta proteína' | 'Bajo carb' | 'Pre-entreno' | etc.
  time: number        // minutes
  cal: number
  prot: number
  carbs: number
  fat: number
  servings: number
  ingredients: { name: string; amount: string }[]
  steps: string[]
  category: 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack'
}

export const RECIPES: Recipe[] = [
  {
    id: 'bowl-proteico',
    name: 'Bowl proteico de pollo',
    emoji: '🍗',
    tag: 'Alta proteína',
    time: 25,
    cal: 520, prot: 48, carbs: 42, fat: 14,
    servings: 1,
    category: 'Almuerzo',
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g' },
      { name: 'Arroz integral cocido', amount: '150g' },
      { name: 'Brócoli', amount: '100g' },
      { name: 'Aceite de oliva', amount: '10ml' },
      { name: 'Ajo, sal, pimienta', amount: 'al gusto' },
    ],
    steps: [
      'Cuece el arroz integral según instrucciones del paquete.',
      'Sazona la pechuga con ajo, sal y pimienta. Cocina a fuego medio 6-7 min por lado.',
      'Cocina el brócoli al vapor 5 minutos.',
      'Arma el bowl con arroz de base, pollo en tiras y brócoli. Rocía con aceite de oliva.',
    ],
  },
  {
    id: 'omelette-espinaca',
    name: 'Omelette de claras y espinaca',
    emoji: '🍳',
    tag: 'Bajo carb',
    time: 10,
    cal: 220, prot: 28, carbs: 4, fat: 9,
    servings: 1,
    category: 'Desayuno',
    ingredients: [
      { name: 'Claras de huevo', amount: '200g (≈6 claras)' },
      { name: 'Espinaca fresca', amount: '50g' },
      { name: 'Tomate cherry', amount: '60g' },
      { name: 'Aceite de coco', amount: '5ml' },
      { name: 'Sal y orégano', amount: 'al gusto' },
    ],
    steps: [
      'Bate las claras con sal y orégano hasta que estén espumosas.',
      'Calienta el aceite en sartén antiadherente a fuego medio.',
      'Vierte las claras y agrega espinaca y tomates cherry partidos.',
      'Dobla el omelette cuando los bordes estén firmes. Sirve caliente.',
    ],
  },
  {
    id: 'salmon-esparragos',
    name: 'Salmón con espárragos al horno',
    emoji: '🐟',
    tag: 'Omega-3',
    time: 20,
    cal: 430, prot: 38, carbs: 6, fat: 28,
    servings: 1,
    category: 'Cena',
    ingredients: [
      { name: 'Filete de salmón', amount: '180g' },
      { name: 'Espárragos', amount: '150g' },
      { name: 'Aceite de oliva', amount: '15ml' },
      { name: 'Limón', amount: '½ unidad' },
      { name: 'Ajo en polvo, sal', amount: 'al gusto' },
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Coloca el salmón y espárragos en bandeja. Rocía con aceite, limón y condimentos.',
      'Hornea 15-18 minutos hasta que el salmón esté cocido en el centro.',
    ],
  },
  {
    id: 'batido-proteico',
    name: 'Batido post-entreno',
    emoji: '🥤',
    tag: 'Post-entreno',
    time: 5,
    cal: 310, prot: 35, carbs: 30, fat: 5,
    servings: 1,
    category: 'Snack',
    ingredients: [
      { name: 'Proteína Whey vainilla', amount: '30g' },
      { name: 'Plátano maduro', amount: '100g' },
      { name: 'Leche descremada', amount: '250ml' },
      { name: 'Avena en hojuelas', amount: '30g' },
    ],
    steps: [
      'Coloca todos los ingredientes en la licuadora.',
      'Licúa 30 segundos hasta obtener consistencia suave.',
      'Consume dentro de los 30 min post-entrenamiento.',
    ],
  },
  {
    id: 'ensalada-atun',
    name: 'Ensalada de atún y quinoa',
    emoji: '🥗',
    tag: 'Ligero',
    time: 15,
    cal: 380, prot: 32, carbs: 38, fat: 10,
    servings: 1,
    category: 'Almuerzo',
    ingredients: [
      { name: 'Atún en agua', amount: '140g (1 lata)' },
      { name: 'Quinoa cocida', amount: '120g' },
      { name: 'Tomate', amount: '80g' },
      { name: 'Pepino', amount: '60g' },
      { name: 'Aceite de oliva', amount: '10ml' },
      { name: 'Limón, sal', amount: 'al gusto' },
    ],
    steps: [
      'Cuece la quinoa según instrucciones (2 partes agua : 1 quinoa, 15 min).',
      'Escurre el atún y desmenuza.',
      'Mezcla quinoa, atún, tomate y pepino en cubitos.',
      'Aliña con aceite de oliva, limón y sal.',
    ],
  },
  {
    id: 'tortilla-avena',
    name: 'Tortilla de avena proteica',
    emoji: '🫓',
    tag: 'Pre-entreno',
    time: 10,
    cal: 280, prot: 22, carbs: 28, fat: 8,
    servings: 1,
    category: 'Desayuno',
    ingredients: [
      { name: 'Avena en hojuelas', amount: '50g' },
      { name: 'Huevo entero', amount: '1 unidad (60g)' },
      { name: 'Claras de huevo', amount: '2 unidades (66g)' },
      { name: 'Leche (cualquier tipo)', amount: '50ml' },
      { name: 'Canela y stevia', amount: 'al gusto' },
    ],
    steps: [
      'Mezcla todos los ingredientes en un bowl hasta integrar.',
      'Vierte en sartén antiadherente a fuego bajo-medio.',
      'Cocina 3-4 min por lado. Sirve con fruta fresca.',
    ],
  },
  {
    id: 'pollo-camote',
    name: 'Pollo con camote y verduras',
    emoji: '🍠',
    tag: 'Volumen',
    time: 35,
    cal: 580, prot: 42, carbs: 58, fat: 14,
    servings: 1,
    category: 'Cena',
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g' },
      { name: 'Camote (batata)', amount: '200g' },
      { name: 'Zucchini', amount: '100g' },
      { name: 'Aceite de oliva', amount: '12ml' },
      { name: 'Pimentón, comino, sal', amount: 'al gusto' },
    ],
    steps: [
      'Corta el camote en cubos y asa al horno 200°C por 25 min.',
      'Saltea el pollo en cubos con aceite y condimentos 8-10 min.',
      'Agrega el zucchini en rodajas los últimos 5 minutos.',
      'Sirve junto al camote asado.',
    ],
  },
  {
    id: 'yogur-frutas',
    name: 'Yogur griego con frutas y granola',
    emoji: '🫙',
    tag: 'Rápido',
    time: 3,
    cal: 290, prot: 18, carbs: 38, fat: 6,
    servings: 1,
    category: 'Snack',
    ingredients: [
      { name: 'Yogur griego 0%', amount: '200g' },
      { name: 'Frutillas / arándanos', amount: '80g' },
      { name: 'Granola sin azúcar', amount: '25g' },
      { name: 'Miel', amount: '10g' },
    ],
    steps: [
      'Coloca el yogur en un bowl.',
      'Agrega las frutas y la granola encima.',
      'Rocía con miel. Listo en menos de 3 minutos.',
    ],
  },
]

export function filterRecipes(query: string, cat?: string): Recipe[] {
  return RECIPES.filter(r => {
    const matchCat = !cat || r.category === cat
    const matchQ = !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.tag.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })
}
