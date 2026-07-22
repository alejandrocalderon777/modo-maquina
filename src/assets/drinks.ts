// Bebidas alcohólicas comunes con calorías por porción estándar
export interface Drink {
  id: string
  name: string
  emoji: string
  serving: string
  cal: number
  carbs: number
}

export const DRINKS: Drink[] = [
  { id:'cerveza',      name:'Cerveza',            emoji:'🍺', serving:'1 lata 350ml', cal:150, carbs:13 },
  { id:'cerveza-art',  name:'Cerveza artesanal',  emoji:'🍺', serving:'1 pinta 470ml', cal:250, carbs:20 },
  { id:'vino-tinto',   name:'Copa de vino tinto', emoji:'🍷', serving:'1 copa 150ml', cal:125, carbs:4 },
  { id:'vino-blanco',  name:'Copa de vino blanco',emoji:'🥂', serving:'1 copa 150ml', cal:120, carbs:4 },
  { id:'espumante',    name:'Espumante',          emoji:'🥂', serving:'1 copa 150ml', cal:120, carbs:3 },
  { id:'pisco-sour',   name:'Pisco sour',         emoji:'🍸', serving:'1 vaso',       cal:220, carbs:20 },
  { id:'piscola',      name:'Piscola',            emoji:'🥃', serving:'1 vaso',       cal:200, carbs:22 },
  { id:'ron-cola',     name:'Ron con cola',       emoji:'🥤', serving:'1 vaso',       cal:190, carbs:20 },
  { id:'whisky',       name:'Whisky',             emoji:'🥃', serving:'1 medida 45ml', cal:105, carbs:0 },
  { id:'vodka',        name:'Vodka',              emoji:'🥃', serving:'1 medida 45ml', cal:97,  carbs:0 },
  { id:'gin-tonic',    name:'Gin tonic',          emoji:'🍸', serving:'1 vaso',       cal:170, carbs:16 },
  { id:'tequila',      name:'Tequila',            emoji:'🥃', serving:'1 shot 45ml',  cal:98,  carbs:0 },
  { id:'michelada',    name:'Michelada',          emoji:'🍺', serving:'1 vaso',       cal:170, carbs:15 },
  { id:'margarita',    name:'Margarita',          emoji:'🍹', serving:'1 vaso',       cal:230, carbs:22 },
]
