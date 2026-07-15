export interface OFFProduct {
  name: string; brand: string
  cal: number; prot: number; carbs: number; fat: number
  serving: number; unit: string; image?: string
}

export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    const n = p.nutriments || {}
    const cal = n['energy-kcal_100g'] || Math.round((n['energy_100g'] || 0) / 4.184)
    const servingRaw = p.serving_size || '100g'
    const servingMatch = servingRaw.match(/(\d+\.?\d*)/)
    return {
      name: p.product_name || p.product_name_es || 'Producto',
      brand: p.brands || '',
      cal: Math.round(cal),
      prot: Math.round((n['proteins_100g'] || 0) * 10) / 10,
      carbs: Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
      fat: Math.round((n['fat_100g'] || 0) * 10) / 10,
      serving: servingMatch ? Math.round(parseFloat(servingMatch[1])) : 100,
      unit: servingRaw.toLowerCase().includes('ml') ? 'ml' : 'g',
      image: p.image_thumb_url || p.image_url,
    }
  } catch { return null }
}
