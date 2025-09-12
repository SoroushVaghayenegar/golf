import { type TeeTime } from './teeTimeService'

// Cache interface for storing share tokens
interface ShareCacheEntry {
  token: string
  createdAt: number
  regionId: number
  teeTimeIds: string[]
}

const CACHE_KEY = 'tee_times_share_cache'
const CACHE_EXPIRY_HOURS = 24 // Cache entries expire after 24 hours

/**
 * Generate a cache key from tee time IDs and region ID
 * This creates a consistent key for the same combination of tee times and region
 */
export function generateShareCacheKey(teeTimeIds: string[], regionId: number): string {
  // Sort the IDs to ensure consistent key generation regardless of selection order
  const sortedIds = [...teeTimeIds].sort()
  return `${regionId}:${sortedIds.join(',')}`
}

/**
 * Get the share cache from localStorage
 */
function getShareCache(): Record<string, ShareCacheEntry> {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch (error) {
    console.warn('Failed to read share cache:', error)
    return {}
  }
}

/**
 * Save the share cache to localStorage
 */
function saveShareCache(cache: Record<string, ShareCacheEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('Failed to save share cache:', error)
  }
}

/**
 * Clean expired entries from the cache
 */
function cleanExpiredEntries(cache: Record<string, ShareCacheEntry>): Record<string, ShareCacheEntry> {
  const now = Date.now()
  const expiryThreshold = CACHE_EXPIRY_HOURS * 60 * 60 * 1000 // Convert to milliseconds
  
  const cleaned: Record<string, ShareCacheEntry> = {}
  
  for (const [key, entry] of Object.entries(cache)) {
    if (now - entry.createdAt < expiryThreshold) {
      cleaned[key] = entry
    }
  }
  
  return cleaned
}

/**
 * Store a share token in the cache
 */
export function cacheShareToken(teeTimes: TeeTime[], regionId: number, token: string): void {
  const teeTimeIds = teeTimes.map(t => t.id)
  const cacheKey = generateShareCacheKey(teeTimeIds, regionId)
  
  // Get existing cache and clean expired entries
  const cache = cleanExpiredEntries(getShareCache())
  
  // Add new entry
  cache[cacheKey] = {
    token,
    createdAt: Date.now(),
    regionId,
    teeTimeIds
  }
  
  // Save updated cache
  saveShareCache(cache)
}

/**
 * Retrieve a share token from the cache if it exists and hasn't expired
 */
export function getCachedShareToken(teeTimes: TeeTime[], regionId: number): string | null {
  const teeTimeIds = teeTimes.map(t => t.id)
  const cacheKey = generateShareCacheKey(teeTimeIds, regionId)
  
  // Get existing cache and clean expired entries
  const cache = cleanExpiredEntries(getShareCache())
  
  // Check if we have a cached entry for this combination
  const entry = cache[cacheKey]
  
  if (entry) {
    // Verify the entry hasn't expired (extra safety check)
    const now = Date.now()
    const expiryThreshold = CACHE_EXPIRY_HOURS * 60 * 60 * 1000
    
    if (now - entry.createdAt < expiryThreshold) {
      return entry.token
    }
  }
  
  return null
}

/**
 * Clear all cached share tokens
 */
export function clearShareCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.warn('Failed to clear share cache:', error)
  }
}

/**
 * Get all cached entries (for debugging/inspection purposes)
 */
export function getShareCacheEntries(): ShareCacheEntry[] {
  const cache = cleanExpiredEntries(getShareCache())
  return Object.values(cache)
}

/**
 * Remove a specific share token from the cache
 */
export function removeCachedShareToken(teeTimes: TeeTime[], regionId: number): void {
  const teeTimeIds = teeTimes.map(t => t.id)
  const cacheKey = generateShareCacheKey(teeTimeIds, regionId)
  
  const cache = getShareCache()
  delete cache[cacheKey]
  
  saveShareCache(cache)
}
