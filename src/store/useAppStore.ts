import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, UserProfile, Measurements, Emotion, FoodEntry, BodyPhoto } from '../types'

const today = () => new Date().toISOString().split('T')[0]

const defaultMacros = {
  calories: { consumed: 0, target: 2200 },
  protein: { consumed: 0, target: 160 },
  carbs: { consumed: 0, target: 220 },
  fat: { consumed: 0, target: 70 },
  water: { consumed: 0, target: 2000 },
}

function calcDayMacros(foodLog: FoodEntry[], targets: typeof defaultMacros) {
  const todayEntries = foodLog.filter(e => e.date === today())
  return {
    calories: { consumed: todayEntries.reduce((s, e) => s + e.cal, 0), target: targets.calories.target },
    protein: { consumed: Math.round(todayEntries.reduce((s, e) => s + e.prot, 0) * 10) / 10, target: targets.protein.target },
    carbs: { consumed: Math.round(todayEntries.reduce((s, e) => s + e.carbs, 0) * 10) / 10, target: targets.carbs.target },
    fat: { consumed: Math.round(todayEntries.reduce((s, e) => s + e.fat, 0) * 10) / 10, target: targets.fat.target },
    water: targets.water,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingComplete: false,
      currentStep: 0,
      profile: {},
      measurements: {},
      streakDays: 0,
      xpPoints: 0,
      macros: defaultMacros,
      foodLog: [],
      bodyPhotos: [],

      setProfile: (data: Partial<UserProfile>) =>
        set((state) => ({ profile: { ...state.profile, ...data } })),

      setMeasurements: (data: Partial<Measurements>) =>
        set((state) => ({ measurements: { ...state.measurements, ...data } })),

      completeOnboarding: () =>
        set({ onboardingComplete: true, streakDays: 1, xpPoints: 100 }),

      setEmotion: (emotion: Emotion) =>
        set((state) => ({ profile: { ...state.profile, emotionToday: emotion } })),

      addXP: (points: number) =>
        set((state) => ({ xpPoints: state.xpPoints + points })),

      addFood: (entry: FoodEntry) =>
        set((state) => {
          const newLog = [...state.foodLog, entry]
          return { foodLog: newLog, macros: calcDayMacros(newLog, state.macros) }
        }),

      removeFood: (id: string) =>
        set((state) => {
          const newLog = state.foodLog.filter(e => e.id !== id)
          return { foodLog: newLog, macros: calcDayMacros(newLog, state.macros) }
        }),

      addBodyPhoto: (photo: BodyPhoto) =>
        set((state) => ({ bodyPhotos: [photo, ...state.bodyPhotos] })),

      setMacroTargets: (targets) =>
        set((state) => ({
          macros: {
            calories: { consumed: state.macros.calories.consumed, target: targets.calories },
            protein:  { consumed: state.macros.protein.consumed,  target: targets.protein },
            carbs:    { consumed: state.macros.carbs.consumed,    target: targets.carbs },
            fat:      { consumed: state.macros.fat.consumed,      target: targets.fat },
            water:    state.macros.water,
          },
        })),

      addWater: (ml: number) =>
        set((state) => ({
          macros: {
            ...state.macros,
            water: {
              ...state.macros.water,
              consumed: Math.min(state.macros.water.consumed + ml, state.macros.water.target),
            },
          },
        })),
    }),
    {
      name: 'modomaquina-storage',
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        measurements: state.measurements,
        streakDays: state.streakDays,
        xpPoints: state.xpPoints,
        foodLog: state.foodLog,
        macros: state.macros,
        bodyPhotos: state.bodyPhotos,
      }),
    }
  )
)
