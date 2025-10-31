# Changes from Chrono to Chrono2

This document outlines the key differences between the original `chrono` folder and the simplified `chrono2` version.

## Major Changes

### 1. Removed CloudScraper
- **Before**: Used `cloudscraper` library with browser fingerprinting
- **After**: Uses standard `requests` library with proxies
- **Impact**: Simpler implementation, smaller dependencies

### 2. Simplified Retry Logic
- **Before**: Random backoff delays between retries (500ms - 19000ms)
- **After**: Immediate retries without delays
- **Impact**: Faster execution, more predictable behavior

### 3. Removed Random Execution Patterns
- **Before**: 
  - Random startup delay (0-120 seconds)
  - Random task shuffling
  - Random browser configuration selection
- **After**: No randomization, deterministic execution
- **Impact**: More predictable execution times

### 4. Proxy Usage
- **Before**: Could use direct connection (no proxy) or one of 5 proxies (6 total options)
- **After**: Always uses one of the 5 Oxylabs proxies (no direct connection option)
- **Impact**: All requests go through proxies for consistency

### 5. Concurrency
- **Before**: Set to 5 (with comment about reducing from 5)
- **After**: Set to 5 (maintained)
- **Impact**: No change

## Detailed Code Changes

### index.py
- Removed: `random` import (except for what's needed in utils)
- Removed: `cloudscraper` import
- Removed: Random startup delay (lines 28-30)
- Removed: Random task shuffling (line 110)
- Removed: `get_random_browser_config()` call and browser config logging
- Removed: `scraper` parameter passed to workers and fetch functions
- Simplified: Worker function no longer needs scraper instance

### utils.py
- Removed: `cloudscraper` import
- Removed: `urllib3` import and SSL warning suppression
- Removed: `SSLAdapter` class (lines 18-26)
- Removed: `get_random_browser_config()` function
- Modified: `get_random_proxy()` - removed `None` option for direct connections
- Modified: `fetch_course_tee_times()` - removed `scraper` parameter
- Modified: `fetch_tee_times_from_chrono_lightspeed()` - removed `scraper` parameter
- Modified: `fetch_with_retry_async()`:
  - Removed `scraper` parameter
  - Removed `max_delay` and `min_delay` parameters
  - Uses `requests.get()` instead of `scraper.get()`
  - Removed random backoff delay logic
  - Removed SSL adapter mounting logic
  - Always uses `verify=False` with proxies

### requirements.txt
- Removed: `cloudscraper==1.2.71`
- Removed: `requests-toolbelt==1.0.0`
- Kept: `requests==2.32.3` (already present as cloudscraper dependency)

### Shell Scripts
- Updated: `test-docker.sh` - image name changed to `fetchteetimes-chrono2-test`
- Updated: `update-or-create-ecr.sh` - default repository name changed to `fetch-tee-times-chrono2`

## Benefits of Chrono2

1. **Simpler codebase**: Easier to understand and maintain
2. **Fewer dependencies**: One less external library to manage
3. **Faster execution**: No random delays during retries or startup
4. **More predictable**: Deterministic behavior makes debugging easier
5. **Consistent proxy usage**: All requests use proxies, no mixed behavior
6. **Debug mode**: Optional detailed progress tracking with tqdm for development and monitoring

## Potential Considerations

1. **Detection risk**: Less randomization may make the scraper more detectable
2. **Rate limiting**: Faster execution without delays may trigger rate limits
3. **CloudFlare**: May not bypass CloudFlare protection as effectively as cloudscraper

## New Features in Chrono2

### Debug Mode
Chrono2 introduces an optional DEBUG mode that provides detailed progress tracking:
- Set `DEBUG=true` environment variable to enable
- Real-time progress bar with ETA using tqdm
- Per-task updates showing course name, date, tee times found
- Live success/failure counts
- Detailed error summary after completion
- Helps with development, testing, and production monitoring

## When to Use Chrono2

Use `chrono2` when:
- The target site doesn't use CloudFlare or advanced bot detection
- Simplicity and predictability are more important than evasion
- You want faster execution times
- You need detailed progress monitoring (DEBUG mode)
- The original chrono is over-engineered for your use case

Use original `chrono` when:
- Dealing with CloudFlare protection
- Need maximum evasion techniques
- Target site has aggressive bot detection

