import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Analiza esta foto de comida y devuelve un JSON con los alimentos detectados y sus macros estimados.
Responde SOLO con JSON válido, sin texto adicional, con este formato exacto:
{
  "alimentos": [
    {
      "nombre": "Arroz cocido",
      "gramos": 150,
      "calorias": 195,
      "proteinas": 4,
      "carbohidratos": 43,
      "grasas": 0
    }
  ],
  "totalCalorias": 195,
  "totalProteinas": 4,
  "totalCarbohidratos": 43,
  "totalGrasas": 0,
  "confianza": "alta"
}
Si no puedes identificar comida en la imagen, devuelve: {"error": "No se detectó comida en la imagen"}`
          }
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No se pudo analizar la imagen' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
