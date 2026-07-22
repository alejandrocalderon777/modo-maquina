import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { imageBase64, mimeType = 'image/jpeg', goal, remaining } = await req.json()
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const macroCtx = remaining
      ? `Macros que le quedan HOY: ${remaining.cal} kcal, ${remaining.prot}g proteína, ${remaining.carbs}g carbos, ${remaining.fat}g grasas.`
      : 'No hay datos de macros restantes.'

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1536,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: `Eres un nutricionista experto ayudando a alguien que está en un restaurante. La imagen es un MENÚ o un PLATO de restaurante.

Objetivo del usuario: ${goal || 'comer saludable'}.
${macroCtx}

Analiza la imagen y orienta al usuario de forma práctica y sin culpa:
1. Si es un MENÚ: recomienda 2-3 opciones que mejor calcen con su objetivo y macros restantes, y menciona 1-2 que conviene evitar y por qué.
2. Si es un PLATO servido: estima sus macros aproximados y aconseja cuánto comer (todo, la mitad, dejar la guarnición, etc.) para no pasarse.
Sé concreto, cercano y breve. Habla en segunda persona.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "tipo": "menu" | "plato",
  "recomendaciones": [
    { "opcion": "Pollo a la plancha con ensalada", "razon": "Alto en proteína, bajo en grasa, calza con tus macros" }
  ],
  "evitar": [
    { "opcion": "Lasaña", "razon": "Muy alta en grasa y calorías para lo que te queda hoy" }
  ],
  "consejo": "Frase corta y directa del coach con la recomendación principal.",
  "macrosEstimados": { "cal": 0, "prot": 0, "carbs": 0, "fat": 0 }
}

Si es un plato, deja "evitar" como [] y llena macrosEstimados. Si es un menú, deja macrosEstimados en 0.
Si no reconoces comida ni menú: {"error": "No se detectó un menú ni un plato en la imagen"}` }
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No se pudo analizar la imagen' }), {
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
