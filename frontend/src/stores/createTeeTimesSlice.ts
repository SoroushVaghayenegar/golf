'use client'

import { fetchTeeTimes, type TeeTime } from '@/services/teeTimeService'

export type TeeTimeFilters = Parameters<typeof fetchTeeTimes>[0]

export type TeeTimesSlice = {
  teeTimes: TeeTime[]
  teeTimesLoading: boolean
  teeTimesError: string | null
  teeTimesLastFilters?: TeeTimeFilters

  fetchTeeTimesAction: (filters: TeeTimeFilters) => Promise<void>
  resetTeeTimes: () => void
}

export const createTeeTimesSlice = (set: (partial: Partial<TeeTimesSlice>) => void): TeeTimesSlice => ({
  teeTimes: [],
  teeTimesLoading: false,
  teeTimesError: null,
  teeTimesLastFilters: undefined,

  fetchTeeTimesAction: async (filters) => {
    set({ teeTimesLoading: true, teeTimesError: null, teeTimesLastFilters: filters })
    try {
      const data = await fetchTeeTimes(filters)
      set({ teeTimes: data })
    } catch {
      set({ teeTimesError: 'Failed to fetch tee times' })
    } finally {
      set({ teeTimesLoading: false })
    }
  },

  resetTeeTimes: () => set({
    teeTimes: [],
    teeTimesLoading: false,
    teeTimesError: null,
    teeTimesLastFilters: undefined,
  }),
})


