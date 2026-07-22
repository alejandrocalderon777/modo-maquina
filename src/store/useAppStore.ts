import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, UserProfile, Measurements, Emotion, FoodEntry, BodyPhoto } from '../types'
import { saveUserData, loadUserData } from '../lib/supabase'
import { evaluateAchievements, getAchievement } from '../assets/achievements'

const today = () => new Date().toISOString().split('T')[0]
const MAX_PROTECTORS = 2

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
      maxStreak: 0,
      streakProtectors: 2,
      protectorsMonth: new Date().toISOString().slice(0, 7),
      protectorUsedDate: undefined,
      whyRecording: undefined,
      showWhyReminder: false,
      workoutFeedback: {},
      activeInjury: undefined,
      unlockedAchievements: [],
      pendingAchievements: [],
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

      // Call on app open: increment streak if it's a new day, recalculate macros
      checkAndUpdateStreak: () => {
        const state = get()
        const t = today()

        // Always recalculate consumed macros from foodLog (fixes stale values after midnight)
        const freshMacros = calcDayMacros(state.foodLog, state.macros)

        if (state.lastOpenDate === t) {
          // Same day — just sync consumed values in case they drifted
          set({ macros: freshMacros })
          return
        }

        // ── Monthly protector refill (2 per month, no accumulation) ──
        const thisMonth = t.slice(0, 7)
        let protectors = state.streakProtectors
        let protectorsMonth = state.protectorsMonth
        if (protectorsMonth !== thisMonth) {
          protectors = MAX_PROTECTORS
          protectorsMonth = thisMonth
        }

        // ── How many days were missed? ──
        let missedDays = 0
        if (state.lastOpenDate) {
          const last = new Date(state.lastOpenDate + 'T12:00:00')
          const now  = new Date(t + 'T12:00:00')
          const diff = Math.round((now.getTime() - last.getTime()) / 86400000)
          missedDays = Math.max(0, diff - 1)   // 0 if yesterday, 1+ if there's a gap
        }

        let newStreak: number
        let protectorUsedDate = state.protectorUsedDate

        if (!state.lastOpenDate) {
          newStreak = 1                                  // first ever open
        } else if (missedDays === 0) {
          newStreak = state.streakDays + 1               // consecutive day
        } else if (protectors >= missedDays) {
          // Protectors cover the gap — streak survives
          protectors -= missedDays
          protectorUsedDate = t
          newStreak = state.streakDays + 1
        } else {
          newStreak = 1                                  // streak broken
        }

        // Volvió tras una ausencia y tiene un "porqué" grabado → recordárselo
        const comesBackAfterGap = missedDays >= 1 && Boolean(state.whyRecording)

        set({
          lastOpenDate: t,
          streakDays: newStreak,
          maxStreak: Math.max(state.maxStreak || 0, newStreak),
          showWhyReminder: comesBackAfterGap || state.showWhyReminder,
          streakProtectors: protectors,
          protectorsMonth,
          protectorUsedDate,
          macros: {
            ...freshMacros,
            water: { consumed: 0, target: state.macros.water.target },
          },
        })
      },

      dismissProtectorNotice: () => set({ protectorUsedDate: undefined }),

      setWhyRecording: (data) =>
        set({ whyRecording: { ...data, date: today() } }),

      dismissWhyReminder: () => set({ showWhyReminder: false }),

      setWorkoutFeedback: (date, fb) =>
        set((state) => ({
          workoutFeedback: { ...state.workoutFeedback, [date]: fb },
          activeInjury: fb.level === 'pain' && fb.zone
            ? { zone: fb.zone, date }
            : state.activeInjury,
        })),

      clearInjury: () => set({ activeInjury: undefined }),

      checkAchievements: () => {
        const state = get()
        const newly = evaluateAchievements(state, state.unlockedAchievements || [])
        if (newly.length === 0) return
        const bonusXP = newly.reduce((sum, id) => sum + (getAchievement(id)?.xp || 0), 0)
        set({
          unlockedAchievements: [...(state.unlockedAchievements || []), ...newly],
          pendingAchievements: [...(state.pendingAchievements || []), ...newly],
          xpPoints: state.xpPoints + bonusXP,
        })
      },

      dismissAchievementNotice: () => set({ pendingAchievements: [] }),
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
        maxStreak: state.maxStreak,
        streakProtectors: state.streakProtectors,
        protectorsMonth: state.protectorsMonth,
        protectorUsedDate: state.protectorUsedDate,
        unlockedAchievements: state.unlockedAchievements,
        whyRecording: state.whyRecording,
        workoutFeedback: state.workoutFeedback,
        activeInjury: state.activeInjury,
        workoutCompletions: state.workoutCompletions,
      }),
    }
  )
)

// ── Cloud sync ───────────────────────────────────────────────
let hydrating = false

function snapshot(s: AppState) {
  return {
    onboardingComplete: s.onboardingComplete,
    profile: s.profile,
    measurements: s.measurements,
    streakDays: s.streakDays,
    xpPoints: s.xpPoints,
    foodLog: s.foodLog,
    macros: s.macros,
    bodyPhotos: s.bodyPhotos,
    lastOpenDate: s.lastOpenDate,
    maxStreak: s.maxStreak,
    streakProtectors: s.streakProtectors,
    protectorsMonth: s.protectorsMonth,
    protectorUsedDate: s.protectorUsedDate,
    unlockedAchievements: s.unlockedAchievements,
    whyRecording: s.whyRecording,
    workoutFeedback: s.workoutFeedback,
    activeInjury: s.activeInjury,
    workoutCompletions: s.workoutCompletions,
  }
}

// Push local changes to the cloud (debounced inside saveUserData; no-op if logged out)
useAppStore.subscribe((state) => {
  if (hydrating) return
  saveUserData(snapshot(state as AppState))
})

// Pull cloud data after login and merge into the store
export async function hydrateFromCloud() {
  const remote = await loadUserData()
  if (!remote) {
    // First login on this account: push whatever is local now
    saveUserData(snapshot(useAppStore.getState()))
    return
  }
  hydrating = true
  useAppStore.setState(remote as Partial<AppState>)
  hydrating = false
}
