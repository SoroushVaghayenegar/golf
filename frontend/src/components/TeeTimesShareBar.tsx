'use client'

import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { ExternalLink, RotateCcw, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { createTeeTimesShare } from '@/services/shareTeeTimesService'
import { getCachedShareToken, cacheShareToken } from '@/services/shareCacheService'
import SharePlanModal from '@/components/SharePlanModal'
import posthog from 'posthog-js'

interface TeeTimesShareBarProps {
  className?: string
  regionId?: number
}

export default function TeeTimesShareBar({ className, regionId }: TeeTimesShareBarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  
  const teeTimesToShare = useAppStore((state) => state.tee_times_to_share)
  const clearTeeTimesToShare = useAppStore((state) => state.clearTeeTimesToShare)
  const isShareFull = useAppStore((state) => state.isShareFull)

  
  // Don't render if no tee times are selected
  if (!teeTimesToShare || teeTimesToShare.length === 0) {
    return null
  }

  const handleShare = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get regionId from prop or fallback to localStorage
      const finalRegionId = regionId || parseInt(localStorage.getItem('selectedRegion') || '1', 10)
      
      // First, check if we already have a cached token for this combination
      const cachedToken = getCachedShareToken(teeTimesToShare, finalRegionId)
      
      let token: string
      
      if (cachedToken) {
        // Use cached token - this makes it extremely fast for repeat shares
        token = cachedToken
        console.log('Using cached share token for tee times combination')
      } else {
        // Create new share and cache the token
        const response = await createTeeTimesShare(teeTimesToShare, finalRegionId)
        token = response.token
        
        // Cache the token for future use
        cacheShareToken(teeTimesToShare, finalRegionId, token)
        
        // Track the share creation event only for new shares
        posthog.capture('tee_time_share_created', {
          tee_times_count: teeTimesToShare.length,
          region_id: finalRegionId
        })
      }
      
      // Always open modal for sharing
      setShareToken(token)
      setIsModalOpen(true)
      
    } catch (err) {
      console.error('Error sharing tee times:', err)
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    clearTeeTimesToShare()
    // Clear modal state when resetting selection
    setIsModalOpen(false)
    setShareToken(null)
    setError(null)
  }

  // Show skeleton version when sharing is in progress
  if (isLoading) {
    return (
      <>
      <div className={`
        fixed bottom-0 left-0 right-0 z-50
        lg:sticky lg:bottom-auto lg:top-0 lg:left-auto lg:right-auto lg:z-auto
        bg-white border-t border-gray-200 shadow-lg
        lg:bg-gray-50 lg:border lg:border-gray-200 lg:rounded-lg lg:shadow-md
        px-4 py-3 lg:px-6 lg:py-4
        pb-[env(safe-area-inset-bottom,0px)]
        flex items-center justify-between
        ${className}
      `}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-10 w-24 lg:h-8 lg:w-16 rounded-lg" />
        </div>
      </div>

      {/* Share Plan Modal */}
      <SharePlanModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        shareToken={shareToken} 
      />
      </>
    )
  }

  return (
    <>
    <div className={`
      fixed bottom-0 left-0 right-0 z-50
      lg:sticky lg:bottom-auto lg:top-0 lg:left-auto lg:right-auto lg:z-auto
      bg-white border-t border-gray-200 shadow-lg
      lg:bg-gray-50 lg:border lg:border-gray-200 lg:rounded-lg lg:shadow-md
      px-4 py-3 lg:px-6 lg:py-4
      flex items-center justify-between
      ${className}
    `}>
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-gray-900">
          {teeTimesToShare.length} tee time{teeTimesToShare.length !== 1 ? 's' : ''} selected
        </div>
        {isShareFull() && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Max reached
          </span>
        )}
        {error && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            {error}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleReset}
          disabled={isLoading}
          className="h-8 w-8 p-0 bg-neutral-500 hover:bg-neutral-600 text-white disabled:opacity-50"
          title="Clear selection"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={handleShare}
          disabled={isLoading}
          size="sm"
          className="bg-purple-500 hover:bg-purple-600 text-white h-10 px-4 lg:h-8 lg:px-3 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 lg:mr-1 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2 lg:mr-1" />
          )}
          {isLoading ? 'Sharing...' : 'Share'}
        </Button>
      </div>
    </div>

    {/* Share Plan Modal */}
    <SharePlanModal 
      isOpen={isModalOpen} 
      onOpenChange={setIsModalOpen} 
      shareToken={shareToken} 
    />
  </>
  )
}
