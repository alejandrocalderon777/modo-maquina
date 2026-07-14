import type { LineageConfig, ArchetypeConfig } from '../types'

export const LINEAGES: LineageConfig[] = [
  {
    id: 'spartan',
    name: 'Espartana',
    fullName: 'Máquina Espartana',
    color: '#E23A2E',
    bgClass: 'bg-spartan-gradient',
    textColor: 'text-spartan',
    borderColor: 'border-spartan',
    levels: ['Recluta de la Agogé', 'Perieco', 'Helota Liberado', 'Hoplita', 'Espartano', 'Guerrero de las Termópilas', 'Espartano'],
    coachStyle: 'directo y exigente',
    emblem: '⚔️',
    free: true,
  },
  {
    id: 'viking',
    name: 'Vikinga',
    fullName: 'Máquina Vikinga',
    color: '#6FD3E8',
    bgClass: 'bg-viking-gradient',
    textColor: 'text-viking',
    borderColor: 'border-viking',
    levels: ['Karl', 'Bóndi', 'Huscarl', 'Berserker', 'Drengr', 'Jarl', 'Einherjar'],
    coachStyle: 'feroz y honorable',
    emblem: '🪓',
    free: true,
  },
  {
    id: 'mapuche',
    name: 'Mapuche',
    fullName: 'Máquina Mapuche',
    color: '#DE782C',
    bgClass: 'bg-mapuche-gradient',
    textColor: 'text-mapuche',
    borderColor: 'border-mapuche',
    levels: ['Weche', 'Mocetón', 'Koñi Wentru', 'Ülmen', 'Werken', 'Lonko', 'Toqui'],
    coachStyle: 'conectado a la tierra y al newen',
    emblem: '🌿',
    free: true,
  },
]

export const ARCHETYPES: ArchetypeConfig[] = [
  {
    id: 'runner',
    name: 'Runner',
    description: 'Resistencia, agilidad y mente clara',
    emoji: '🏃',
    traits: ['Cardio', 'Resistencia', 'Mental'],
  },
  {
    id: 'builder',
    name: 'Constructor',
    description: 'Fuerza, masa muscular y poder',
    emoji: '💪',
    traits: ['Fuerza', 'Masa', 'Potencia'],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Equilibrio, tonificación y bienestar',
    emoji: '⚡',
    traits: ['Tono', 'Flexibilidad', 'Equilibrio'],
  },
  {
    id: 'warrior',
    name: 'Guerrero',
    description: 'Funcional, explosivo y versátil',
    emoji: '🗡️',
    traits: ['Funcional', 'Explosivo', 'Completo'],
  },
]

export const LINEAGE_COACH_PHRASES: Record<string, string[]> = {
  spartan: [
    'Un espartano no negocia con la pereza.',
    'El dolor de hoy es la fortaleza de mañana.',
    'Regresa con tu escudo o sobre él.',
    'La disciplina es la base del Imperio.',
  ],
  viking: [
    'Los dioses observan. Demuéstrales que eres digno.',
    'El frío forja lo que el calor no puede.',
    'Solo los fuertes llegan a Valhalla.',
    'Cada gota de sudor es una ofrenda a Odín.',
  ],
  mapuche: [
    'El newen está en ti. Despiértalo.',
    'La mapu te da fuerza cuando la respetas.',
    'Un guerrero mapuche nunca abandona su tierra interior.',
    'Kimün y küme mogñen: saber vivir bien.',
  ],
}

export const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Bajar de peso',
  gain_muscle: 'Ganar músculo',
  health: 'Salud general',
  endurance: 'Resistencia',
}

export const LEVEL_LABELS: Record<string, string> = {
  sedentary: 'Sedentario (casi no me muevo)',
  beginner: 'Principiante (activo esporádico)',
  intermediate: 'Intermedio (entreno regularmente)',
  advanced: 'Avanzado (atleta consistente)',
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  gym: 'Gimnasio',
  home: 'Casa',
  outdoor: 'Aire libre',
  none: 'Sin equipamiento',
}
