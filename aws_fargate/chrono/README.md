# ChronoGolf Tee Times Fetcher - Region-based (Python)

Python implementation of the ChronoGolf tee times fetcher with Cloudflare bypass using `cloudscraper`.

## Features

- **Cloudflare Bypass**: Uses `cloudscraper` to bypass Cloudflare bot detection
- **Async/Concurrent Processing**: Efficiently processes multiple courses and dates concurrently
- **Region-based Filtering**: Fetches tee times for courses in specified regions
- **Batch Database Updates**: Manages memory by upserting in batches
- **Progress Tracking**: Visual progress bars and detailed logging
- **Error Handling**: Comprehensive error handling with Sentry integration
- **Docker Support**: Containerized for easy deployment to AWS Fargate

## Project Structure

```
chrono/
├── index.py              # Main handler function
├── utils.py              # Utility functions for fetching and upserting
├── course.py             # Course data class
├── tee_time.py           # TeeTime data class
├── requirements.txt      # Python dependencies
├── Dockerfile            # Docker configuration
├── test_local.py         # Local testing script
├── test-docker.sh        # Docker testing script
├── update-or-create-ecr.sh  # ECR deployment script
├── .env.example          # Example environment variables
└── README.md             # This file
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `REGION_ID`: Comma-separated list of region IDs (e.g., "1,2,3")

Optional variables:
- `CRON_CHECK_URL`: Health check URL for monitoring
- `SENTRY_DSN`: Sentry DSN for error tracking

## Usage

### Local Testing

```bash
python test_local.py
```

### Docker Testing

```bash
chmod +x test-docker.sh
./test-docker.sh
```

### Deploy to AWS ECR

```bash
chmod +x update-or-create-ecr.sh
./update-or-create-ecr.sh [repository-name] [aws-region]
```

Example:
```bash
./update-or-create-ecr.sh fetchteetimes-chrono-region-python us-west-2
```

## How It Works

1. **Fetch Courses**: Queries Supabase for courses in specified regions with `CHRONO_LIGHTSPEED` API
2. **Build Tasks**: Creates a list of course/date combinations based on booking visibility settings
3. **Concurrent Processing**: Uses asyncio with configurable concurrency (default: 10 workers)
4. **Fetch Tee Times**: For each course/date:
   - Fetches tee times for different player counts (1-4 players)
   - Uses cloudscraper to bypass Cloudflare protection
   - Aggregates results by start time
   - Generates booking links
5. **Batch Upsert**: Periodically upserts results to Supabase in batches to manage memory
6. **Health Check**: Sends a health check signal to monitoring service

## Key Differences from TypeScript Version

- **Cloudflare Bypass**: Uses `cloudscraper` instead of plain `fetch`
- **Async Implementation**: Uses Python's `asyncio` instead of Node.js promises
- **Progress Bars**: Uses `tqdm` instead of `progress` npm package
- **Type Safety**: Uses dataclasses with type hints instead of TypeScript classes
- **Memory Management**: Explicit garbage collection with `gc.collect()`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `REGION_ID` | Yes | Comma-separated region IDs |
| `CRON_CHECK_URL` | No | Health check URL |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

## Performance

- **Concurrency**: 10 workers by default (configurable in `index.py`)
- **Batch Size**: 100 records per database upsert (configurable)
- **Memory Management**: Clears results after each batch upsert

## Error Handling

- Retries failed requests up to 5 times with exponential backoff
- Reports errors to Sentry if configured
- Continues processing even if individual requests fail
- Returns summary of errors in final response

## Monitoring

The script provides detailed logging:
- Progress updates (every 10 tasks when not in TTY)
- Batch upsert status
- Final execution summary with:
  - Total execution time
  - Courses processed
  - Date combinations processed
  - Tee times found
  - Database batches processed
  - Error count

## License

See main project LICENSE file.

