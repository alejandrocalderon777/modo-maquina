export interface FoodItem {
  id: string
  name: string
  cal: number   // per 100g
  prot: number  // g per 100g
  carbs: number
  fat: number
  serving: number  // default serving in grams
  unit: string
  category: string
}

export const FOODS: FoodItem[] = [
  // PROTEÍNAS
  { id: 'pollo-pechuga', name: 'Pechuga de pollo', cal: 165, prot: 31, carbs: 0, fat: 3.6, serving: 150, unit: 'g', category: 'Proteínas' },
  { id: 'atun-lata', name: 'Atún en agua', cal: 116, prot: 26, carbs: 0, fat: 1, serving: 140, unit: 'g', category: 'Proteínas' },
  { id: 'salmon', name: 'Salmón', cal: 208, prot: 20, carbs: 0, fat: 13, serving: 150, unit: 'g', category: 'Proteínas' },
  { id: 'huevo-entero', name: 'Huevo entero', cal: 155, prot: 13, carbs: 1.1, fat: 11, serving: 60, unit: 'g', category: 'Proteínas' },
  { id: 'clara-huevo', name: 'Clara de huevo', cal: 52, prot: 11, carbs: 0.7, fat: 0.2, serving: 50, unit: 'g', category: 'Proteínas' },
  { id: 'carne-molida', name: 'Carne molida (90%)', cal: 176, prot: 26, carbs: 0, fat: 8, serving: 150, unit: 'g', category: 'Proteínas' },
  { id: 'filete-vacuno', name: 'Filete de vacuno', cal: 187, prot: 29, carbs: 0, fat: 7, serving: 150, unit: 'g', category: 'Proteínas' },
  { id: 'cerdo-lomo', name: 'Lomo de cerdo', cal: 182, prot: 27, carbs: 0, fat: 8, serving: 150, unit: 'g', category: 'Proteínas' },
  { id: 'whey-protein', name: 'Proteína Whey', cal: 380, prot: 75, carbs: 10, fat: 5, serving: 30, unit: 'g', category: 'Proteínas' },
  { id: 'yogur-griego', name: 'Yogur griego (0%)', cal: 59, prot: 10, carbs: 3.6, fat: 0.4, serving: 200, unit: 'g', category: 'Proteínas' },
  { id: 'cottage', name: 'Queso cottage', cal: 98, prot: 11, carbs: 3.4, fat: 4.3, serving: 150, unit: 'g', category: 'Proteínas' },
  { id: 'pavo-pechuga', name: 'Pechuga de pavo', cal: 135, prot: 30, carbs: 0, fat: 1, serving: 150, unit: 'g', category: 'Proteínas' },

  // CARBOHIDRATOS
  { id: 'arroz-blanco', name: 'Arroz blanco cocido', cal: 130, prot: 2.7, carbs: 28, fat: 0.3, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'arroz-integral', name: 'Arroz integral cocido', cal: 111, prot: 2.6, carbs: 23, fat: 0.9, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'avena', name: 'Avena en hojuelas', cal: 389, prot: 17, carbs: 66, fat: 7, serving: 80, unit: 'g', category: 'Carbohidratos' },
  { id: 'pasta', name: 'Pasta cocida', cal: 131, prot: 5, carbs: 25, fat: 1.1, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'papa-cocida', name: 'Papa cocida', cal: 87, prot: 1.9, carbs: 20, fat: 0.1, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'camote', name: 'Camote cocido', cal: 90, prot: 2, carbs: 21, fat: 0.1, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'pan-integral', name: 'Pan integral', cal: 247, prot: 9, carbs: 41, fat: 3.4, serving: 60, unit: 'g', category: 'Carbohidratos' },
  { id: 'pan-blanco', name: 'Pan blanco (marraqueta)', cal: 268, prot: 9, carbs: 51, fat: 3, serving: 80, unit: 'g', category: 'Carbohidratos' },
  { id: 'quinoa', name: 'Quinoa cocida', cal: 120, prot: 4.4, carbs: 21, fat: 1.9, serving: 180, unit: 'g', category: 'Carbohidratos' },
  { id: 'lentejas', name: 'Lentejas cocidas', cal: 116, prot: 9, carbs: 20, fat: 0.4, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'porotos', name: 'Porotos cocidos', cal: 127, prot: 8.7, carbs: 23, fat: 0.5, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'garbanzos', name: 'Garbanzos cocidos', cal: 164, prot: 8.9, carbs: 27, fat: 2.6, serving: 200, unit: 'g', category: 'Carbohidratos' },
  { id: 'tortilla-maiz', name: 'Tortilla de maíz', cal: 218, prot: 5.7, carbs: 46, fat: 2.5, serving: 50, unit: 'g', category: 'Carbohidratos' },

  // GRASAS
  { id: 'palta', name: 'Palta / Aguacate', cal: 160, prot: 2, carbs: 9, fat: 15, serving: 100, unit: 'g', category: 'Grasas' },
  { id: 'aceite-oliva', name: 'Aceite de oliva', cal: 884, prot: 0, carbs: 0, fat: 100, serving: 10, unit: 'ml', category: 'Grasas' },
  { id: 'almendras', name: 'Almendras', cal: 579, prot: 21, carbs: 22, fat: 50, serving: 30, unit: 'g', category: 'Grasas' },
  { id: 'nueces', name: 'Nueces', cal: 654, prot: 15, carbs: 14, fat: 65, serving: 30, unit: 'g', category: 'Grasas' },
  { id: 'mantequilla-mani', name: 'Mantequilla de maní', cal: 588, prot: 25, carbs: 20, fat: 50, serving: 30, unit: 'g', category: 'Grasas' },

  // LÁCTEOS
  { id: 'leche-entera', name: 'Leche entera', cal: 61, prot: 3.2, carbs: 4.8, fat: 3.3, serving: 250, unit: 'ml', category: 'Lácteos' },
  { id: 'leche-descremada', name: 'Leche descremada', cal: 34, prot: 3.4, carbs: 5, fat: 0.1, serving: 250, unit: 'ml', category: 'Lácteos' },
  { id: 'queso-cheddar', name: 'Queso cheddar', cal: 402, prot: 25, carbs: 1.3, fat: 33, serving: 30, unit: 'g', category: 'Lácteos' },

  // FRUTAS
  { id: 'platano', name: 'Plátano / Banana', cal: 89, prot: 1.1, carbs: 23, fat: 0.3, serving: 120, unit: 'g', category: 'Frutas' },
  { id: 'manzana', name: 'Manzana', cal: 52, prot: 0.3, carbs: 14, fat: 0.2, serving: 180, unit: 'g', category: 'Frutas' },
  { id: 'naranja', name: 'Naranja', cal: 47, prot: 0.9, carbs: 12, fat: 0.1, serving: 150, unit: 'g', category: 'Frutas' },
  { id: 'frutilla', name: 'Frutillas', cal: 32, prot: 0.7, carbs: 7.7, fat: 0.3, serving: 150, unit: 'g', category: 'Frutas' },
  { id: 'sandia', name: 'Sandía', cal: 30, prot: 0.6, carbs: 7.6, fat: 0.2, serving: 300, unit: 'g', category: 'Frutas' },

  // VERDURAS
  { id: 'brocoli', name: 'Brócoli cocido', cal: 35, prot: 2.4, carbs: 7.2, fat: 0.4, serving: 200, unit: 'g', category: 'Verduras' },
  { id: 'espinaca', name: 'Espinaca', cal: 23, prot: 2.9, carbs: 3.6, fat: 0.4, serving: 100, unit: 'g', category: 'Verduras' },
  { id: 'lechuga', name: 'Lechuga', cal: 15, prot: 1.4, carbs: 2.9, fat: 0.2, serving: 100, unit: 'g', category: 'Verduras' },
  { id: 'tomate', name: 'Tomate', cal: 18, prot: 0.9, carbs: 3.9, fat: 0.2, serving: 150, unit: 'g', category: 'Verduras' },
  { id: 'zanahoria', name: 'Zanahoria', cal: 41, prot: 0.9, carbs: 10, fat: 0.2, serving: 100, unit: 'g', category: 'Verduras' },
  { id: 'pepino', name: 'Pepino', cal: 16, prot: 0.7, carbs: 3.6, fat: 0.1, serving: 150, unit: 'g', category: 'Verduras' },

  // COMIDAS CHILENAS
  { id: 'cazuela-pollo', name: 'Cazuela de pollo', cal: 120, prot: 14, carbs: 10, fat: 3, serving: 400, unit: 'g', category: 'Platos' },
  { id: 'churrasco', name: 'Churrasco (sin pan)', cal: 220, prot: 28, carbs: 2, fat: 11, serving: 200, unit: 'g', category: 'Platos' },
  { id: 'ensalada-chilena', name: 'Ensalada chilena', cal: 40, prot: 1, carbs: 6, fat: 1.5, serving: 150, unit: 'g', category: 'Platos' },
]

export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return FOODS.slice(0, 12)
  const q = query.toLowerCase()
  return FOODS.filter(f => f.name.toLowerCase().includes(q)).slice(0, 20)
}

export function calcMacros(food: FoodItem, grams: number) {
  const ratio = grams / 100
  return {
    cal: Math.round(food.cal * ratio),
    prot: Math.round(food.prot * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
  }
}
