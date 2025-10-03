# Memory Optimization Changes

## Problem
The Fargate container was experiencing memory errors with a 250 MB limit due to accumulating all tee times data in memory before upserting to the database.

## Solution
Implemented batch processing with periodic database upserts and garbage collection to manage memory usage.

## Changes Made

### 1. index.ts
- **Batch Processing**: Instead of collecting all results and upserting at the end, the script now:
  - Upserts to the database every `UPSERT_BATCH_SIZE` (20) tasks
  - Clears the results array after each batch upsert
  - Tracks total tee times and errors across all batches
  
- **Garbage Collection**: After each batch upsert:
  - Clears the results array (`results.length = 0`)
  - Manually triggers garbage collection if available (`global.gc()`)
  
- **Memory-friendly Tracking**: 
  - Changed from accumulating all data to tracking counts (`totalTeeTimes`, `totalUpsertBatches`)
  - Maintains error tracking across batches (`allErrors` array)

### 2. Dockerfile
- Updated CMD to expose garbage collection: `node --expose-gc -r ts-node/register index.ts`
- This allows the script to manually trigger garbage collection

### 3. package.json
- Updated all npm scripts to include `--expose-gc` flag:
  - `test`: `node --expose-gc -r ts-node/register test-local.ts`
  - `test-js`: `node --expose-gc -r ts-node/register test-local.js`
  - `start`: `node --expose-gc -r ts-node/register index.ts`

## Configuration

### Adjustable Parameters
- `UPSERT_BATCH_SIZE = 20`: Number of course/date combinations to process before upserting to DB
  - **Increase** this value if you have more memory available
  - **Decrease** this value if memory issues persist
  
- `concurrency = 2`: Number of parallel workers fetching tee times
  - Keep this low to manage memory and API rate limits

## Benefits
1. **Consistent Memory Usage**: Memory footprint stays relatively constant instead of growing linearly
2. **Faster Failure Recovery**: Partial results are saved even if the script fails mid-execution
3. **Better Progress Tracking**: Can see database upserts happening throughout execution
4. **Garbage Collection**: Actively frees memory after each batch

## Testing
To test locally with the new memory management:
```bash
npm test
# or
npm start
```

The script will log when it triggers garbage collection and when it performs batch upserts.

