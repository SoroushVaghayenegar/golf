# ChronoGolf Tee Times Fetcher - Chrono2 (Simplified Version)

This is a simplified version of the ChronoGolf tee times fetcher that uses the standard `requests` library with Oxylabs proxies instead of cloudscraper.

## Key Differences from Original Chrono

- **No cloudscraper**: Uses standard `requests` library
- **No random delays**: Simplified retry logic without random backoff delays
- **Always uses proxies**: Every request uses an Oxylabs proxy (no direct connections)
- **Simpler implementation**: Removed complexity around Cloudflare evasion
- **Fixed concurrency**: Set to 5 concurrent workers

## Features

- Fetches tee times from ChronoGolf/Lightspeed API
- Supports multiple regions
- Uses Oxylabs residential proxies for all requests
- Concurrent processing with 5 workers
- Batch database upserts for efficiency
- Error tracking with Sentry

## Environment Variables

Required:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `REGION_ID`: Comma-separated region IDs (e.g., "1,2,3")

Optional:
- `SENTRY_DSN`: Sentry DSN for error tracking
- `CRON_CHECK_URL`: Health check URL to ping on completion
- `DEBUG`: Enable debug mode with detailed progress tracking (set to "true", "1", or "yes")

## Local Development

1. Create a `.env` file with required environment variables
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run locally:
   ```bash
   python test_local.py
   ```

## Docker Testing

```bash
chmod +x test-docker.sh
./test-docker.sh
```

## Deployment to AWS

```bash
chmod +x update-or-create-ecr.sh
./update-or-create-ecr.sh [repository-name] [region]
```

Default repository name: `fetch-tee-times-chrono2`
Default region: `us-west-2`

## Architecture

- **index.py**: Main handler and orchestration
- **utils.py**: HTTP requests and data processing utilities
- **course.py**: Course data model
- **tee_time.py**: Tee time data model

## Proxy Configuration

Uses Oxylabs datacenter proxies with 5 different ports to distribute requests across different IPs.

## Debug Mode

Set the `DEBUG` environment variable to enable detailed progress tracking:

```bash
export DEBUG=true
```

When enabled, debug mode provides:
- Real-time progress bar with ETA using tqdm
- Per-task progress updates showing:
  - Current course name and date being processed
  - Number of tee times found
  - Success/failure counts in real-time
  - Latest task status (✓ or ✗)
- Detailed error summary after completion showing:
  - Total number of fetch errors
  - Course ID and date for each error
  - Error messages (first 10 errors shown)
- Immediate visibility into which tasks are being processed

When disabled (default), the system logs progress at milestone percentages (0%, 25%, 50%, 75%, 99%).

Example debug output:
```
Fetching tee times: 45%|████▌     | 101/224 [02:15<02:45, 1.34s/task, course=Langara Golf Course, date=10/19, tee_times=12, success=95, failed=6, status=✓]
```

