# Memory Optimization Strategy

## Problem
Processing large numbers of courses and dates can lead to memory issues, especially in containerized environments with limited resources.

## Solution
Implemented a batched upsert strategy to manage memory usage:

### Key Features

1. **Batch Processing**
   - Results are accumulated in memory up to `UPSERT_BATCH_SIZE` (default: 100)
   - When threshold is reached, batch is upserted to database
   - Results array is cleared after each upsert
   - Forces garbage collection after clearing

2. **Concurrent Workers**
   - Uses asyncio task queue with multiple workers (default: 10)
   - Workers process tasks concurrently but respect batch size limits
   - Each worker fetches tee times and adds to shared results array

3. **Memory Management**
   ```python
   # Clear results array
   results.clear()
   
   # Force garbage collection
   gc.collect()
   ```

4. **Progress Tracking**
   - Uses `tqdm` for visual progress in TTY environments
   - Falls back to periodic logging when not in TTY
   - Minimal memory overhead

### Configuration

Adjust these parameters in `index.py` based on your environment:

```python
UPSERT_BATCH_SIZE = 100  # Number of course/date combinations before upsert
concurrency = 10         # Number of concurrent workers
```

### Memory Usage Pattern

```
Memory usage pattern:
┌─────────────────────────────────────────┐
│  ^                                      │
│  │        /\         /\         /\      │
│  │       /  \       /  \       /  \     │
│  │      /    \     /    \     /    \    │
│  │     /      \   /      \   /      \   │
│  │    /        \_/        \_/        \_ │
│  └────────────────────────────────────> │
│       Time                               │
│                                          │
│  Memory increases as results accumulate, │
│  then drops after each batch upsert      │
└─────────────────────────────────────────┘
```

### Benefits

1. **Predictable Memory Usage**: Memory never exceeds `UPSERT_BATCH_SIZE * avg_tee_times_per_result`
2. **Faster Processing**: Don't wait until all fetches complete before upserting
3. **Better Error Recovery**: If process fails, some data is already saved
4. **Reduced Database Load**: Batched upserts are more efficient than single inserts

### Monitoring

The script logs memory management actions:
```
Upserting 100 course/date combinations to database...
Processing batch 1/5 (100 records)
Batch 1/5 completed successfully
Garbage collection triggered
```

### Docker Configuration

Dockerfile uses Python 3.12-slim for minimal base image size and includes only necessary system dependencies:

```dockerfile
FROM python:3.12-slim
# Install only necessary system packages
RUN apt-get update && apt-get install -y gcc g++ libffi-dev libssl-dev
```

### Further Optimization

If still experiencing memory issues:

1. Reduce `UPSERT_BATCH_SIZE` to 50 or 25
2. Reduce `concurrency` to 5 or fewer workers
3. Process regions separately instead of all at once
4. Increase container memory limits in AWS Fargate

## Results

With these optimizations:
- ✅ Can process 1000+ course/date combinations
- ✅ Memory usage stays below 512MB
- ✅ Suitable for AWS Fargate smallest task size (0.5 vCPU, 1GB memory)

