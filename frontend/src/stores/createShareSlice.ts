'use client'

import { type TeeTime } from '@/services/teeTimeService'

const MAX_SHARE_LIMIT = 5

export type ShareSlice = {
  tee_times_to_share: TeeTime[]
  
  addTeeTimeToShare: (teeTime: TeeTime) => void
  removeTeeTimeFromShare: (teeTimeId: string) => void
  clearTeeTimesToShare: () => void
  isTeeTimeInShareList: (teeTimeId: string) => boolean
  isShareFull: () => boolean
  
}

export const createShareSlice = (set: (partial: Partial<ShareSlice>) => void, get: () => ShareSlice): ShareSlice => ({
  tee_times_to_share: [],

  addTeeTimeToShare: (teeTime) => {
    const currentTimes = get().tee_times_to_share
    const exists = currentTimes.some((t: TeeTime) => t.id === teeTime.id)
    
    if (!exists) {
      set({ tee_times_to_share: [...currentTimes, teeTime] })
    }
  },

  removeTeeTimeFromShare: (teeTimeId) => {
    const currentTimes = get().tee_times_to_share
    set({ 
      tee_times_to_share: currentTimes.filter((t: TeeTime) => t.id !== teeTimeId) 
    })
  },

  clearTeeTimesToShare: () => {
    set({ tee_times_to_share: [] })
  },

  isTeeTimeInShareList: (teeTimeId) => {
    const currentTimes = get().tee_times_to_share
    return currentTimes.some((t: TeeTime) => t.id === teeTimeId)
  },

  isShareFull: () => {
    const currentTimes = get().tee_times_to_share
    return currentTimes.length >= MAX_SHARE_LIMIT
  },
})
