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
    const { query } = await req.json()
    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Consulta muy corta' }), {
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
        content: `Eres un nutricionista experto con acceso a tablas nutricionales precisas (USDA, tablas chilenas/latinoamericanas).

El usuario busca: "${query}"

Devuelve entre 1 y 5 alimentos que coincidan con la búsqueda, con sus valores nutricionales POR 100 GRAMOS (o por 100ml si es líquido).
Incluye variantes relevantes (ej: si busca "pollo" → pechuga, muslo, ala; si busca "cerdo" → filete, lomo, costilla).
Usa valores nutricionales reales y precisos.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "resultados": [
    {
      "nombre": "Filete de cerdo (magro)",
      "cal": 143,
      "prot": 21,
      "carbs": 0,
      "fat": 6,
      "unidad": "g"
    }
  ]
}

Si no reconoces ningún alimento: {"resultados": []}`
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ resultados: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
