'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createTeeTimesSlice, type TeeTimesSlice } from '@/stores/createTeeTimesSlice'

type Theme = 'light' | 'dark'

type ThemeSlice = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resetAll: () => void
}

export type AppState = ThemeSlice & TeeTimesSlice

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme slice
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      resetAll: () => set({ theme: 'light' }),

      // Tee times slice
      ...createTeeTimesSlice(set),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only theme; avoid persisting fetched tee times by default
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)


