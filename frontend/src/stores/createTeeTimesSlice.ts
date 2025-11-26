'use client'

import { fetchTeeTimes, type TeeTime, type TeeTimeFilters, type FetchProgress } from '@/services/teeTimeService'

export type { TeeTimeFilters }

// Store the current abort function globally within this module
let currentAbortFn: (() => void) | null = null;

export type TeeTimesSlice = {
  teeTimes: TeeTime[]
  teeTimesLoading: boolean
  teeTimesError: string | null
  teeTimesLastFilters?: TeeTimeFilters
  teeTimesProgress: FetchProgress | null

  fetchTeeTimesAction: (filters: TeeTimeFilters) => Promise<void>
  abortFetchTeeTimes: () => void
  resetTeeTimes: () => void
}

export const createTeeTimesSlice = (set: (partial: Partial<TeeTimesSlice>) => void): TeeTimesSlice => ({
  teeTimes: [],
  teeTimesLoading: false,
  teeTimesError: null,
  teeTimesLastFilters: undefined,
  teeTimesProgress: null,

  fetchTeeTimesAction: async (filters) => {
    // Abort any existing fetch before starting a new one
    if (currentAbortFn) {
      currentAbortFn();
      currentAbortFn = null;
    }
    
    set({ 
      teeTimesLoading: true, 
      teeTimesError: null, 
      teeTimesLastFilters: filters,
      teeTimesProgress: { completed: 0, total: 0 }
    })
    
    try {
      const { promise, abort } = fetchTeeTimes(filters, {
        onProgress: (progress) => {
          set({ teeTimesProgress: progress })
        },
        onComplete: (teeTimes) => {
          set({ teeTimes, teeTimesProgress: null })
        },
        onError: (error) => {
          set({ teeTimesError: error, teeTimesProgress: null })
        },
        onAbort: () => {
          // When aborted, keep the current tee times but stop loading
          set({ teeTimesLoading: false, teeTimesProgress: null })
        }
      })
      
      // Store the abort function
      currentAbortFn = abort;
      
      const data = await promise
      currentAbortFn = null;
      set({ teeTimes: data })
    } catch {
      currentAbortFn = null;
      set({ teeTimesError: 'Failed to fetch tee times', teeTimesProgress: null })
    } finally {
      set({ teeTimesLoading: false })
    }
  },

  abortFetchTeeTimes: () => {
    if (currentAbortFn) {
      currentAbortFn();
      currentAbortFn = null;
    }
  },

  resetTeeTimes: () => {
    if (currentAbortFn) {
      currentAbortFn();
      currentAbortFn = null;
    }
    set({
      teeTimes: [],
      teeTimesLoading: false,
      teeTimesError: null,
      teeTimesLastFilters: undefined,
      teeTimesProgress: null,
    })
  },
})
