export type Archetype = 'runner' | 'builder' | 'fitness' | 'warrior'
export type Lineage = 'spartan' | 'viking' | 'mapuche'
export type Goal = 'lose_weight' | 'gain_muscle' | 'health' | 'endurance'
export type Level = 'sedentary' | 'beginner' | 'intermediate' | 'advanced'
export type Equipment = 'gym' | 'home' | 'outdoor' | 'none'
export type Emotion = 1 | 2 | 3 | 4 | 5
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface UserProfile {
  name: string; goal: Goal; level: Level; equipment: Equipment[]
  daysPerWeek: number; archetype: Archetype; lineage: Lineage
  emotionToday?: Emotion; emotionDate?: string  // emotionDate = YYYY-MM-DD
  sex?: 'male' | 'female'; age?: number
}
export interface Measurements {
  age?: number
  weight: number; height: number; neck?: number; chest?: number
  waist?: number; hips?: number; bicep?: number; thigh?: number
}
export interface DayMacros {
  calories: { consumed: number; target: number }
  protein: { consumed: number; target: number }
  carbs: { consumed: number; target: number }
  fat: { consumed: number; target: number }
  water: { consumed: number; target: number }
}

export interface FoodEntry {
  id: string
  foodId: string
  name: string
  grams: number
  cal: number
  prot: number
  carbs: number
  fat: number
  mealType: MealType
  date: string   // YYYY-MM-DD
  timestamp: number
}

export interface AppState {
  onboardingComplete: boolean
  profile: Partial<UserProfile>; measurements: Partial<Measurements>
  streakDays: number; xpPoints: number; macros: DayMacros
  foodLog: FoodEntry[]
  bodyPhotos: BodyPhoto[]
  lastOpenDate: string          // YYYY-MM-DD — for streak tracking
  maxStreak: number             // best streak ever
  streakProtectors: number      // comodines disponibles
  protectorsMonth: string       // YYYY-MM del último refill
  protectorUsedDate?: string    // fecha en que se usó el último protector (para avisar)
  whyRecording?: { audio?: string; text?: string; date: string }  // el "porqué" grabado
  showWhyReminder: boolean        // true tras una ausencia — el avatar lo recuerda
  unlockedAchievements: string[]  // ids de logros desbloqueados
  pendingAchievements: string[]   // ids por notificar al usuario
  workoutCompletions: Record<string, string[]>  // date → array of exercise names done

  setProfile: (data: Partial<UserProfile>) => void
  setMeasurements: (data: Partial<Measurements>) => void
  completeOnboarding: () => void
  setEmotion: (emotion: Emotion) => void
  addXP: (points: number) => void
  addFood: (entry: FoodEntry) => void
  removeFood: (id: string) => void
  addWater: (ml: number) => void
  addBodyPhoto: (photo: BodyPhoto) => void
  setMacroTargets: (targets: { calories: number; protein: number; carbs: number; fat: number }) => void
  toggleWorkout: (date: string, exerciseName: string) => void
  checkAndUpdateStreak: () => void
  dismissProtectorNotice: () => void
  setWhyRecording: (data: { audio?: string; text?: string }) => void
  dismissWhyReminder: () => void
  checkAchievements: () => void
  dismissAchievementNotice: () => void
}
export interface LineageConfig {
  id: Lineage; name: string; fullName: string; color: string
  bgClass: string; textColor: string; borderColor: string
  levels: string[]; coachStyle: string; emblem: string; free: boolean
}
export interface ArchetypeConfig {
  id: Archetype; name: string; description: string; emoji: string; traits: string[]
}

export interface BodyPhoto {
  id: string
  date: string       // YYYY-MM-DD
  dataUrl: string    // compressed base64 JPEG
  note?: string
}
