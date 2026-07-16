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
    protein:  { consumed: Math.round(todayEntries.reduce((s, e) => s + e.prot, 0)  * 10) / 10, target: targets.protein.target },
    carbs:    { consumed: Math.round(todayEntries.reduce((s, e) => s + e.carbs, 0) * 10) / 10, target: targets.carbs.target },
    fat:      { consumed: Math.round(todayEntries.reduce((s, e) => s + e.fat, 0)   * 10) / 10, target: targets.fat.target },
    water:    targets.water,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingComplete: false,
      profile: {},
      measurements: {},
      streakDays: 0,
      xpPoints: 0,
      macros: defaultMacros,
      foodLog: [],
      bodyPhotos: [],
      lastOpenDate: '',
      workoutCompletions: {},

      setProfile: (data: Partial<UserProfile>) =>
        set((state) => ({ profile: { ...state.profile, ...data } })),

      setMeasurements: (data: Partial<Measurements>) =>
        set((state) => ({ measurements: { ...state.measurements, ...data } })),

      completeOnboarding: () =>
        set({ onboardingComplete: true, streakDays: 1, xpPoints: 100, lastOpenDate: today() }),

      // Store emotion with today's date so check-in resets daily
      setEmotion: (emotion: Emotion) =>
        set((state) => ({
          profile: { ...state.profile, emotionToday: emotion, emotionDate: today() }
        })),

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
              consumed: Math.min(state.macros.water.consumed + ml, state.macros.water.target * 2),
              target: state.macros.water.target,
            },
          },
        })),

      // Toggle a workout exercise done/undone for a given date
      toggleWorkout: (date: string, exerciseName: string) =>
        set((state) => {
          const current = state.workoutCompletions[date] || []
          const isDone = current.includes(exerciseName)
          return {
            workoutCompletions: {
              ...state.workoutCompletions,
              [date]: isDone
                ? current.filter(n => n !== exerciseName)
                : [...current, exerciseName],
            },
          }
        }),

      // Call on app open: increment streak if it's a new day, reset water daily
      checkAndUpdateStreak: () => {
        const state = get()
        const t = today()
        if (state.lastOpenDate === t) return  // already opened today

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yStr = yesterday.toISOString().split('T')[0]

        const newStreak = state.lastOpenDate === yStr
          ? state.streakDays + 1   // consecutive day
          : 1                       // streak broken or first time

        // Also reset water consumed at midnight
        set({
          lastOpenDate: t,
          streakDays: newStreak,
          macros: {
            ...state.macros,
            water: { consumed: 0, target: state.macros.water.target },
          },
        })
      },
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
        lastOpenDate: state.lastOpenDate,
        workoutCompletions: state.workoutCompletions,
      }),
    }
  )
)
