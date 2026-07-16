import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATE_PROMPT = `Eres un nutricionista experto con amplio conocimiento de la gastronomía latinoamericana y chilena.

Analiza esta imagen de comida CON EL MÁXIMO DETALLE POSIBLE.

INSTRUCCIONES CRÍTICAS:
1. Identifica CADA alimento visible por separado — no agrupes si puedes separar
2. Si ves un plato complejo (pastel de choclo, charquicán, cazuela, lasaña, etc.), desglósalo en sus ingredientes principales
3. Estima los gramos de cada componente visualmente
4. Incluye guarniciones, ensaladas, salsas, aderezos, pan, bebidas — TODO lo que veas
5. Para platos chilenos típicos usa estos desgloces:
   - Pastel de choclo → cubierta de choclo, carne molida, pollo, cebolla, aceituna, huevo, pasa
   - Charquicán → zapallo, papas, porotos verdes, charqui/carne, choclo
   - Cazuela → carne/pollo, papa, zapallo, choclo, arroz, poroto verde
   - Empanada → masa, pino (carne molida, cebolla, aceituna, huevo, pasa)
   - Carbonada → carne, papa, zanahoria, zapallo, choclo, arroz
   - Porotos → porotos, longaniza/costillar, merken
   - Ajiaco → carne, papa, ají
6. Para ensaladas lista cada vegetal por separado
7. Si hay proteína principal (pollo, carne, pescado, legumbres) calcúlala por separado
8. Sé específico: "pechuga de pollo a la plancha" no solo "pollo"

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "alimentos": [
    {
      "nombre": "Nombre específico del alimento",
      "gramos": 120,
      "calorias": 165,
      "proteinas": 31,
      "carbohidratos": 0,
      "grasas": 3.6
    }
  ],
  "totalCalorias": 165,
  "totalProteinas": 31,
  "totalCarbohidratos": 0,
  "totalGrasas": 3.6,
  "plato_principal": "Nombre del plato principal detectado",
  "confianza": "alta|media|baja"
}

Si no hay comida visible: {"error": "No se detectó comida en la imagen"}`

const LABEL_PROMPT = `Eres un nutricionista experto. Analiza esta etiqueta nutricional y extrae la información.

Lee con precisión todos los valores de la tabla nutricional.
Si la etiqueta muestra valores por porción, usa esa porción como base.

Responde ÚNICAMENTE con JSON válido:
{
  "alimentos": [
    {
      "nombre": "Nombre del producto de la etiqueta",
      "gramos": 100,
      "calorias": 0,
      "proteinas": 0,
      "carbohidratos": 0,
      "grasas": 0
    }
  ],
  "totalCalorias": 0,
  "totalProteinas": 0,
  "totalCarbohidratos": 0,
  "totalGrasas": 0,
  "plato_principal": "Nombre del producto",
  "confianza": "alta"
}

Si no puedes leer la etiqueta: {"error": "No se pudo leer la etiqueta nutricional"}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', mode = 'plate' } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const prompt = mode === 'label' ? LABEL_PROMPT : PLATE_PROMPT

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          { type: 'text', text: prompt }
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

    return new Response(jsonMatch[0], {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
