import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLATE_PROMPT = `Eres un nutricionista y chef experto en gastronomía internacional, con dominio profundo de las cocinas de Chile, Perú, Brasil, Venezuela, Colombia, Argentina, México, Italia, Francia, España y Medio Oriente (árabe).

Analiza esta imagen de comida CON EL MÁXIMO DETALLE POSIBLE.

INSTRUCCIONES CRÍTICAS:
1. Identifica CADA alimento visible por separado — desglosa, no agrupes
2. Reconoce el plato específico y desglósalo en sus ingredientes principales con gramos estimados visualmente
3. Incluye guarniciones, ensaladas, salsas, aderezos, pan, arroz, bebidas — TODO lo visible
4. Sé específico en la preparación: "pechuga de pollo a la plancha", no solo "pollo"
5. Si hay proteína principal (carne, pollo, pescado, cerdo, legumbres) sepárala siempre

GUÍA DE PLATOS POR PAÍS (desglosa así cuando los reconozcas):

CHILE:
- Pastel de choclo → choclo molido, carne molida (pino), pollo, cebolla, aceituna, huevo duro, pasas
- Charquicán → zapallo, papa, porotos verdes, carne/charqui, choclo, cebolla
- Cazuela → carne o pollo, papa, zapallo, choclo, arroz, poroto verde
- Empanada de pino → masa, carne molida, cebolla, aceituna, huevo, pasa
- Porotos granados → porotos, zapallo, choclo, albahaca
- Completo / churrasco → pan, vienesa o carne, palta, tomate, mayonesa
- Chorrillana → papas fritas, carne, cebolla, huevo, longaniza
- Curanto / pescado frito, machas a la parmesana, caldillo de congrio
- Sopaipillas, humitas, arrollado, prieta, longaniza

PERÚ:
- Ceviche → pescado crudo, limón, cebolla morada, camote, choclo, ají
- Lomo saltado → carne de res, cebolla, tomate, papas fritas, arroz
- Ají de gallina → pollo deshilachado, salsa de ají amarillo, pan, nueces, arroz, papa, huevo
- Causa limeña → papa amarilla, ají, pollo o atún, palta, mayonesa
- Arroz con pollo, anticuchos, rocoto relleno, papa a la huancaína

BRASIL:
- Feijoada → porotos negros, carne de cerdo, costilla, longaniza, tocino, arroz, farofa, naranja
- Pão de queijo, coxinha, moqueca (pescado, leche de coco, palma), acarajé
- Picanha, feijão tropeiro, brigadeiro, açaí bowl

VENEZUELA:
- Arepa → maíz, relleno (queso, carne mechada, pollo, caraotas, aguacate)
- Pabellón criollo → carne mechada, caraotas negras, arroz, plátano frito
- Hallaca, cachapa, tequeños, empanada venezolana

COLOMBIA:
- Bandeja paisa → frijoles, arroz, carne molida, chicharrón, chorizo, huevo frito, plátano, aguacate, arepa
- Ajiaco → pollo, papa criolla, papa sabanera, mazorca, guascas, crema, alcaparras
- Sancocho, arepa de huevo, empanada colombiana, patacón

MÉXICO:
- Tacos → tortilla, carne (al pastor, carnitas, asada), cebolla, cilantro, salsa
- Enchiladas, quesadilla, guacamole, tamales, mole, pozole, chilaquiles, burrito

ITALIA:
- Pasta (lasaña → pasta, carne molida, salsa bolognesa, bechamel, queso; carbonara, boloñesa, pesto, alfredo)
- Pizza → masa, salsa de tomate, mozzarella, ingredientes específicos
- Risotto, gnocchi, ossobuco, caprese, minestrone, tiramisú

FRANCIA:
- Ratatouille, coq au vin, quiche, croissant, crêpe, boeuf bourguignon
- Gratin dauphinois, croque monsieur, salade niçoise, foie gras

ÁRABE / MEDIO ORIENTE:
- Falafel → garbanzos fritos; hummus → garbanzos, tahini, aceite de oliva
- Shawarma → carne o pollo, pan pita, salsa de ajo, vegetales
- Kibbeh (crudo o frito), tabbouleh, baba ganoush, kebab, arroz árabe, hojas de parra, baklava

ESPAÑA:
- Paella → arroz, azafrán, mariscos o pollo, verduras; tortilla española, jamón, gazpacho, croquetas

ARGENTINA:
- Asado, milanesa, empanada argentina, choripán, provoleta, locro

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "alimentos": [
    { "nombre": "Nombre específico del alimento", "gramos": 120, "calorias": 165, "proteinas": 31, "carbohidratos": 0, "grasas": 3.6 }
  ],
  "totalCalorias": 165,
  "totalProteinas": 31,
  "totalCarbohidratos": 0,
  "totalGrasas": 3.6,
  "plato_principal": "Nombre del plato principal detectado",
  "confianza": "alta|media|baja"
}

Si no hay comida visible: {"error": "No se detectó comida en la imagen"}`

const LABEL_PROMPT = `Eres un nutricionista experto. Analiza esta etiqueta nutricional y extrae la información con precisión.

Lee todos los valores de la tabla nutricional. Si muestra valores por porción, usa esa porción como base e indícala en gramos.

Responde ÚNICAMENTE con JSON válido:
{
  "alimentos": [
    { "nombre": "Nombre del producto", "gramos": 100, "calorias": 0, "proteinas": 0, "carbohidratos": 0, "grasas": 0 }
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
