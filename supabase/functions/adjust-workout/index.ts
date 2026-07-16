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
    const { currentPlan, missedDays, goal, level, daysPerWeek, remainingDays } = await req.json()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    })

    const context = `
Plan semanal actual: ${JSON.stringify(currentPlan)}
Días no cumplidos: ${JSON.stringify(missedDays)}
Días restantes en la semana: ${JSON.stringify(remainingDays)}
Objetivo del usuario: ${goal || 'ganar músculo'}
Nivel: ${level || 'intermedio'}
Días de entrenamiento por semana: ${daysPerWeek || 4}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1536,
      messages: [{
        role: 'user',
        content: `Eres un entrenador personal experto. El usuario no cumplió uno o más entrenamientos de su plan semanal.

${context}

Reorganiza el plan de los DÍAS RESTANTES de la semana para recuperar el trabajo muscular perdido sin sobrecargar. Prioriza los grupos musculares que quedaron sin entrenar. Respeta el nivel y los días disponibles. Si no alcanza a recuperar todo, prioriza los grupos más importantes para el objetivo.

Grupos musculares válidos: Pecho, Espalda, Piernas, Hombros, Bíceps, Tríceps, Core, Glúteos, Cardio.

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "plan": [
    { "day": "Mié", "type": "Fuerza — Tren superior", "muscles": ["Pecho", "Tríceps"], "note": "Recupera el pecho del lunes" },
    { "day": "Jue", "type": "Descanso", "muscles": [], "note": "" }
  ],
  "resumen": "Moví el trabajo de pecho al miércoles y combiné piernas con glúteos el viernes para recuperar la semana."
}`
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No se pudo recalcular el plan' }), {
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
