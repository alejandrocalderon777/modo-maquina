import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, UserProfile, Measurements, Emotion, DayMacros } from '../types'

const defaultMacros: DayMacros = {
  calories: { consumed: 0, target: 2200 },
  protein: { consumed: 0, target: 160 },
  carbs: { consumed: 0, target: 220 },
  fat: { consumed: 0, target: 70 },
  water: { consumed: 0, target: 2000 },
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      currentStep: 0,
      profile: {},
      measurements: {},
      streakDays: 0,
      xpPoints: 0,
      macros: defaultMacros,

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
    }),
    {
      name: 'modomaquina-storage',
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        measurements: state.measurements,
        streakDays: state.streakDays,
        xpPoints: state.xpPoints,
      }),
    }
  )
)
