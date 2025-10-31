# Cloudflare Evasion Changes - Summary

## Overview
This document summarizes all the changes made to avoid Cloudflare detection when scraping ChronoGolf every 10 minutes.

## Changes Made

### 1. User-Agent Rotation (`utils.py`)
- Added pool of 14 different user agents (Chrome, Firefox, Safari on macOS/Windows)
- User agent is randomly selected for each request
- Function: `get_random_user_agent()`

### 2. Browser Fingerprint Rotation (`utils.py`)
- Added random browser configuration selection
- Rotates between Chrome/Firefox on Darwin/Windows platforms
- Function: `get_random_browser_config()`
- Applied in `index.py` when creating scraper

### 3. Proxy Rotation (`utils.py`)
- Integrated Oxylabs residential proxies
- 5 proxy ports (8001-8005) that rotate randomly for each request
- Credentials: username `ttimesgolf_Bw3Ck`, password `mjuw_Y5+Zmq4Gt=`
- Host: `dc.oxylabs.io`
- Function: `get_random_proxy()`

### 4. Header Randomization (`utils.py`)
- Headers now randomized per request instead of fixed
- Randomized Accept-Language selection
- Optional headers (Cache-Control, DNT, Pragma) added randomly
- Function: `get_random_headers()`

### 5. Increased Request Delays (`utils.py`)
- **First attempt**: 1.5-4 seconds delay (was 0.2-0.5s)
- **Retry attempts**: 5-15 seconds delay (was 2-19s)
- **Additional backoff**: 3-8 seconds on retries
- All delays are randomized to avoid patterns

### 6. Reduced Concurrency (`index.py`)
- Reduced from 5 concurrent workers to 2
- Makes request patterns less obvious
- Line 214: `concurrency = 2`

### 7. Task Order Randomization (`index.py`)
- Tasks are shuffled before processing
- Line 108: `random.shuffle(tasks)`
- Prevents predictable access patterns

### 8. Startup Delay (`index.py`)
- Added 0-2 minute random delay at startup
- Line 27-29: Prevents execution at exactly the same time every 10 minutes
- Makes cron job less predictable

### 9. Inter-Task Jitter (`index.py`)
- Added 0.5-2 second random delay between tasks
- Line 198-199: Prevents regular timing patterns
- Applied after each task completion

## Files Modified

1. `/Users/soroush/Desktop/dev/golf/aws_fargate/chrono/utils.py`
   - Added user agent pool
   - Added proxy configuration
   - Added randomization functions
   - Updated `fetch_with_retry_async()` to use all randomization techniques

2. `/Users/soroush/Desktop/dev/golf/aws_fargate/chrono/index.py`
   - Added startup delay
   - Reduced concurrency
   - Added task shuffling
   - Added inter-task jitter
   - Imported `get_random_browser_config()`

## Key Benefits

1. **Diverse Fingerprints**: Each request looks like it comes from a different browser/OS combination
2. **IP Rotation**: Requests come from different IPs via proxy rotation
3. **Unpredictable Timing**: Random delays prevent pattern detection
4. **Lower Volume**: Reduced concurrency makes traffic less suspicious
5. **Natural Behavior**: Random jitter mimics human browsing patterns

## Testing Recommendations

1. Monitor Cloudflare blocks in the next few runs
2. Check Sentry for any new errors related to proxies
3. Verify execution time is acceptable with increased delays
4. Monitor Oxylabs proxy usage/bandwidth

## Notes

- Execution time will increase due to:
  - Startup delay (0-2 minutes)
  - Increased request delays (1.5-4s per request)
  - Reduced concurrency (2 instead of 5)
  - Inter-task jitter (0.5-2s between tasks)
  
- Expected impact: Function may take 2-3x longer to complete, but should avoid Cloudflare detection

## If Still Getting Blocked

If Cloudflare continues to block:
1. Increase delays further (4-8 seconds per request)
2. Reduce concurrency to 1
3. Add more user agents to the pool
4. Verify Oxylabs proxies are working correctly
5. Consider using residential proxies with country/city targeting

