export type MuscleGroup =
  | 'Pecho' | 'Espalda' | 'Piernas' | 'Hombros'
  | 'Bíceps' | 'Tríceps' | 'Core' | 'Glúteos' | 'Cardio'

export type Equipment = 'ninguno' | 'mancuernas' | 'barra' | 'maquina' | 'banda' | 'kettlebell'

export interface Exercise {
  id: string
  name: string
  muscle: MuscleGroup
  sets: string
  equipment: Equipment
  level: 'principiante' | 'intermedio' | 'avanzado'
  tip: string
}

export const MUSCLE_GROUPS: { id: MuscleGroup; emoji: string }[] = [
  { id: 'Pecho',    emoji: '💪' },
  { id: 'Espalda',  emoji: '🔙' },
  { id: 'Piernas',  emoji: '🦵' },
  { id: 'Hombros',  emoji: '🏔️' },
  { id: 'Bíceps',   emoji: '💪' },
  { id: 'Tríceps',  emoji: '🔱' },
  { id: 'Core',     emoji: '🎯' },
  { id: 'Glúteos',  emoji: '🍑' },
  { id: 'Cardio',   emoji: '❤️' },
]

export const EXERCISES: Exercise[] = [
  // ── PECHO ──
  { id:'pe1', name:'Press banca con barra', muscle:'Pecho', sets:'4×8-10', equipment:'barra', level:'intermedio', tip:'Baja la barra al pecho controlando, codos a 45°.' },
  { id:'pe2', name:'Press inclinado mancuernas', muscle:'Pecho', sets:'3×10-12', equipment:'mancuernas', level:'intermedio', tip:'Banco a 30-45° para trabajar pecho superior.' },
  { id:'pe3', name:'Aperturas con mancuernas', muscle:'Pecho', sets:'3×12-15', equipment:'mancuernas', level:'principiante', tip:'Movimiento amplio, ligera flexión de codos.' },
  { id:'pe4', name:'Flexiones de pecho', muscle:'Pecho', sets:'4×máx', equipment:'ninguno', level:'principiante', tip:'Cuerpo recto, baja hasta casi tocar el suelo.' },
  { id:'pe5', name:'Fondos en paralelas', muscle:'Pecho', sets:'3×8-12', equipment:'ninguno', level:'avanzado', tip:'Inclina el torso adelante para enfocar pecho.' },

  // ── ESPALDA ──
  { id:'es1', name:'Dominadas', muscle:'Espalda', sets:'4×6-10', equipment:'ninguno', level:'avanzado', tip:'Agarre ancho, lleva el pecho a la barra.' },
  { id:'es2', name:'Remo con barra', muscle:'Espalda', sets:'4×8-10', equipment:'barra', level:'intermedio', tip:'Espalda recta, tira hacia el ombligo.' },
  { id:'es3', name:'Jalón al pecho (polea)', muscle:'Espalda', sets:'3×10-12', equipment:'maquina', level:'principiante', tip:'Baja la barra al pecho, no atrás de la nuca.' },
  { id:'es4', name:'Remo con mancuerna', muscle:'Espalda', sets:'3×10-12', equipment:'mancuernas', level:'principiante', tip:'Apóyate en banco, tira el codo alto.' },
  { id:'es5', name:'Peso muerto', muscle:'Espalda', sets:'4×6-8', equipment:'barra', level:'avanzado', tip:'Espalda neutra, empuja con las piernas.' },

  // ── PIERNAS ──
  { id:'pi1', name:'Sentadilla con barra', muscle:'Piernas', sets:'4×8-10', equipment:'barra', level:'intermedio', tip:'Baja hasta muslos paralelos, rodillas alineadas.' },
  { id:'pi2', name:'Prensa de piernas', muscle:'Piernas', sets:'4×10-12', equipment:'maquina', level:'principiante', tip:'No bloquees rodillas arriba.' },
  { id:'pi3', name:'Zancadas', muscle:'Piernas', sets:'3×12 c/pierna', equipment:'mancuernas', level:'principiante', tip:'Rodilla trasera casi toca el suelo.' },
  { id:'pi4', name:'Peso muerto rumano', muscle:'Piernas', sets:'3×10-12', equipment:'barra', level:'intermedio', tip:'Trabaja femorales, baja con caderas atrás.' },
  { id:'pi5', name:'Sentadilla goblet', muscle:'Piernas', sets:'3×12-15', equipment:'mancuernas', level:'principiante', tip:'Sostén una mancuerna al pecho.' },

  // ── HOMBROS ──
  { id:'ho1', name:'Press militar con barra', muscle:'Hombros', sets:'4×8-10', equipment:'barra', level:'intermedio', tip:'Empuja arriba sin arquear la espalda.' },
  { id:'ho2', name:'Elevaciones laterales', muscle:'Hombros', sets:'4×12-15', equipment:'mancuernas', level:'principiante', tip:'Sube hasta la altura de hombros, controla.' },
  { id:'ho3', name:'Press Arnold', muscle:'Hombros', sets:'3×10-12', equipment:'mancuernas', level:'intermedio', tip:'Rota las muñecas al subir.' },
  { id:'ho4', name:'Pájaros (posterior)', muscle:'Hombros', sets:'3×15', equipment:'mancuernas', level:'principiante', tip:'Inclina el torso, abre los brazos atrás.' },
  { id:'ho5', name:'Elevaciones frontales', muscle:'Hombros', sets:'3×12', equipment:'mancuernas', level:'principiante', tip:'Sube al frente hasta altura de ojos.' },

  // ── BÍCEPS ──
  { id:'bi1', name:'Curl con barra', muscle:'Bíceps', sets:'4×10-12', equipment:'barra', level:'principiante', tip:'Codos fijos, no balancees el cuerpo.' },
  { id:'bi2', name:'Curl con mancuernas', muscle:'Bíceps', sets:'3×12', equipment:'mancuernas', level:'principiante', tip:'Alterna brazos, supina la muñeca.' },
  { id:'bi3', name:'Curl martillo', muscle:'Bíceps', sets:'3×12', equipment:'mancuernas', level:'principiante', tip:'Agarre neutro, trabaja el braquial.' },
  { id:'bi4', name:'Curl concentrado', muscle:'Bíceps', sets:'3×12 c/brazo', equipment:'mancuernas', level:'intermedio', tip:'Codo apoyado en el muslo, máxima contracción.' },

  // ── TRÍCEPS ──
  { id:'tr1', name:'Fondos en banco', muscle:'Tríceps', sets:'4×12', equipment:'ninguno', level:'principiante', tip:'Codos hacia atrás, baja controlado.' },
  { id:'tr2', name:'Extensión en polea', muscle:'Tríceps', sets:'3×12-15', equipment:'maquina', level:'principiante', tip:'Codos pegados al cuerpo.' },
  { id:'tr3', name:'Press francés', muscle:'Tríceps', sets:'3×10-12', equipment:'barra', level:'intermedio', tip:'Baja la barra a la frente, codos fijos.' },
  { id:'tr4', name:'Patada de tríceps', muscle:'Tríceps', sets:'3×12 c/brazo', equipment:'mancuernas', level:'principiante', tip:'Extiende el brazo atrás completamente.' },

  // ── CORE ──
  { id:'co1', name:'Plancha', muscle:'Core', sets:'4×45seg', equipment:'ninguno', level:'principiante', tip:'Cuerpo recto, aprieta abdomen y glúteos.' },
  { id:'co2', name:'Crunch abdominal', muscle:'Core', sets:'4×20', equipment:'ninguno', level:'principiante', tip:'Sube con el abdomen, no tires del cuello.' },
  { id:'co3', name:'Elevación de piernas', muscle:'Core', sets:'3×15', equipment:'ninguno', level:'intermedio', tip:'Baja las piernas sin tocar el suelo.' },
  { id:'co4', name:'Russian twist', muscle:'Core', sets:'3×20', equipment:'ninguno', level:'intermedio', tip:'Rota el torso lado a lado, pies elevados.' },
  { id:'co5', name:'Mountain climbers', muscle:'Core', sets:'4×30seg', equipment:'ninguno', level:'principiante', tip:'Rodillas al pecho rápido, cadera baja.' },

  // ── GLÚTEOS ──
  { id:'gl1', name:'Hip thrust', muscle:'Glúteos', sets:'4×10-12', equipment:'barra', level:'intermedio', tip:'Apoya la espalda en banco, empuja con talones.' },
  { id:'gl2', name:'Sentadilla búlgara', muscle:'Glúteos', sets:'3×12 c/pierna', equipment:'mancuernas', level:'intermedio', tip:'Pie trasero elevado, baja recto.' },
  { id:'gl3', name:'Puente de glúteos', muscle:'Glúteos', sets:'4×15', equipment:'ninguno', level:'principiante', tip:'Aprieta glúteos arriba 1 segundo.' },
  { id:'gl4', name:'Patada de glúteo', muscle:'Glúteos', sets:'3×15 c/pierna', equipment:'banda', level:'principiante', tip:'Extiende la pierna atrás, controla.' },

  // ── CARDIO ──
  { id:'ca1', name:'Trote continuo', muscle:'Cardio', sets:'25-30 min', equipment:'ninguno', level:'principiante', tip:'Ritmo constante, respira controlado.' },
  { id:'ca2', name:'HIIT intervalos', muscle:'Cardio', sets:'15-20 min', equipment:'ninguno', level:'intermedio', tip:'30seg intenso / 30seg descanso.' },
  { id:'ca3', name:'Burpees', muscle:'Cardio', sets:'4×15', equipment:'ninguno', level:'avanzado', tip:'Flexión + salto explosivo.' },
  { id:'ca4', name:'Saltar la cuerda', muscle:'Cardio', sets:'10-15 min', equipment:'ninguno', level:'principiante', tip:'Saltos bajos, muñecas hacen el trabajo.' },
  { id:'ca5', name:'Bicicleta / spinning', muscle:'Cardio', sets:'30-40 min', equipment:'maquina', level:'principiante', tip:'Resistencia media, cadencia constante.' },
]

export function exercisesByMuscle(muscle: MuscleGroup): Exercise[] {
  return EXERCISES.filter(e => e.muscle === muscle)
}

export function exercisesForEquipment(available: Equipment[]): Exercise[] {
  if (available.length === 0) return EXERCISES
  return EXERCISES.filter(e => e.equipment === 'ninguno' || available.includes(e.equipment))
}
