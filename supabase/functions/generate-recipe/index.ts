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
    const { prompt: userPrompt, goal, mealType, ingredients } = await req.json()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const context = [
      userPrompt ? `Petición del usuario: ${userPrompt}` : '',
      goal ? `Objetivo fitness: ${goal}` : '',
      mealType ? `Tipo de comida: ${mealType}` : '',
      ingredients ? `Ingredientes disponibles: ${ingredients}` : '',
    ].filter(Boolean).join('\n')

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1536,
      messages: [{
        role: 'user',
        content: `Eres un chef nutricionista experto en comida saludable, fitness y gastronomía chilena/latina.

Genera UNA receta saludable basada en:
${context || 'Una receta saludable alta en proteína'}

Requisitos:
- Ingredientes accesibles en supermercados chilenos
- Macros calculados con precisión para 1 porción
- Pasos claros y concisos
- Enfocada en objetivos fitness

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "name": "Nombre de la receta",
  "emoji": "🍽️",
  "tag": "Alta proteína",
  "time": 20,
  "cal": 450,
  "prot": 40,
  "carbs": 35,
  "fat": 14,
  "servings": 1,
  "category": "Almuerzo",
  "ingredients": [ { "name": "Ingrediente", "amount": "150g" } ],
  "steps": [ "Paso 1", "Paso 2" ]
}

category debe ser exactamente uno de: Desayuno, Almuerzo, Cena, Snack.
tag debe ser corto (ej: Alta proteína, Bajo carb, Pre-entreno, Post-entreno, Vegetariano, Omega-3, Bajo cal).`
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No se pudo generar la receta' }), {
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
