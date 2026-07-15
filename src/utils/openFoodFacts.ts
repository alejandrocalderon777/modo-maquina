export interface OFFProduct {
  name: string; brand: string
  cal: number; prot: number; carbs: number; fat: number
  serving: number; unit: string; image?: string
}

async function fetchOFF(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

export async function lookupBarcode(barcode: string): Promise<OFFProduct | null> {
  // Try world endpoint first, then Chilean mirror as fallback
  const urls = [
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
    `https://cl.openfoodfacts.org/api/v0/product/${barcode}.json`,
  ]

  for (const url of urls) {
    try {
      const res = await fetchOFF(url)
      if (!res.ok) continue
      const data = await res.json()
      if (data.status !== 1 || !data.product) continue

      const p = data.product
      const n = p.nutriments || {}

      // Try multiple calorie field names
      const cal =
        n['energy-kcal_100g'] ??
        n['energy-kcal'] ??
        (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : 0) ??
        0

      const servingRaw = (p.serving_size || '100 g').toString()
      const servingMatch = servingRaw.match(/(\d+\.?\d*)/)
      const servingG = servingMatch ? Math.round(parseFloat(servingMatch[1])) : 100

      // Accept even if cal=0 — user can still see protein/carbs/fat
      return {
        name: (p.product_name_es || p.product_name || p.product_name_en || 'Producto sin nombre').trim(),
        brand: (p.brands || '').trim(),
        cal: Math.round(cal),
        prot: Math.round((n['proteins_100g'] ?? n['proteins'] ?? 0) * 10) / 10,
        carbs: Math.round((n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0) * 10) / 10,
        fat: Math.round((n['fat_100g'] ?? n['fat'] ?? 0) * 10) / 10,
        serving: servingG > 0 ? servingG : 100,
        unit: servingRaw.toLowerCase().includes('ml') ? 'ml' : 'g',
        image: p.image_thumb_url || p.image_front_thumb_url || p.image_url || undefined,
      }
    } catch {
      // timeout or network error — try next URL
      continue
    }
  }
  return null
}
