import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { goal, calories, protein, carbs, fat, restrictions, dislikes } = await req.json()

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const context = [
      goal ? `Objetivo: ${goal}` : '',
      calories ? `Meta diaria: ${calories} kcal, ${protein}g proteína, ${carbs}g carbos, ${fat}g grasas` : '',
      restrictions ? `Restricciones: ${restrictions}` : '',
      dislikes ? `No le gusta: ${dislikes}` : '',
    ].filter(Boolean).join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Eres un nutricionista experto en gastronomía chilena/latina. Crea un plan de comidas SEMANAL (7 días) equilibrado y variado.

${context || 'Plan saludable equilibrado alto en proteína'}

Requisitos:
- 4 comidas por día: desayuno, almuerzo, cena, snack
- Ingredientes accesibles en supermercados chilenos (Jumbo, Líder)
- Variado: no repetir el mismo plato principal
- Realista y práctico de preparar
- Además genera una LISTA DE SUPERMERCADO consolidada agrupada por categoría, sumando cantidades de toda la semana

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "dias": [
    {
      "dia": "Lunes",
      "comidas": {
        "desayuno": { "nombre": "Avena con plátano", "kcal": 350 },
        "almuerzo": { "nombre": "Pollo con arroz y ensalada", "kcal": 550 },
        "cena": { "nombre": "Salmón con verduras", "kcal": 450 },
        "snack": { "nombre": "Yogur con frutos secos", "kcal": 200 }
      }
    }
  ],
  "listaSupermercado": [
    { "categoria": "Proteínas", "items": ["Pechuga de pollo 1kg", "Salmón 500g", "Huevos 12u"] },
    { "categoria": "Carbohidratos", "items": ["Arroz integral 1kg", "Avena 500g"] },
    { "categoria": "Verduras y frutas", "items": ["Brócoli 2u", "Plátano 6u"] },
    { "categoria": "Lácteos", "items": ["Yogur griego 1kg"] },
    { "categoria": "Otros", "items": ["Aceite de oliva"] }
  ]
}

Genera los 7 días completos (Lunes a Domingo).`
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No se pudo generar el plan' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    return new Response(jsonMatch[0], { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
