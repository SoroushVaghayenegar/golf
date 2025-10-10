"""Main handler for fetching ChronoGolf tee times - Region-based version"""
import os
import sys
import time
import asyncio
import gc
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pytz
import cloudscraper
from supabase import create_client, Client
import sentry_sdk
import httpx

from course import Course
from utils import (
    fetch_course_tee_times,
    batch_upsert_tee_times,
    time_string_to_minutes
)


async def handler():
    """Main handler function for fetching tee times by region"""
    # Start timer
    start_time = time.time()
    
    # Initialize Sentry if DSN is provided
    sentry_dsn = os.environ.get('SENTRY_DSN')
    if sentry_dsn:
        sentry_sdk.init(dsn=sentry_dsn)
    
    try:
        # Create Supabase client
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_service_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        supabase: Client = create_client(supabase_url, supabase_service_key)
        
        # Parse region IDs from environment variable
        region_ids_str = os.environ.get('REGION_ID')
        if not region_ids_str:
            raise ValueError("REGION_ID environment variable must be set")
        
        region_ids = [int(rid.strip()) for rid in region_ids_str.split(',')]
        print(f"Processing regions: {region_ids}")
        
        # Fetch courses from database
        response = supabase.table('courses').select(
            '*',
            'cities!inner(name, region_id)'
        ).in_('cities.region_id', region_ids).eq(
            'external_api', 'CHRONO_LIGHTSPEED'
        ).execute()
        
        if not response.data:
            raise ValueError("No courses found for specified regions")
        
        # Convert to Course objects
        courses = [Course.from_dict(course_data) for course_data in response.data]
        print(f"Fetched {len(courses)} courses")
        
        # Helper functions for timezone-aware date/time
        def get_date(timezone_str: str) -> datetime:
            """Get current date in specified timezone"""
            tz = pytz.timezone(timezone_str)
            return datetime.now(tz).date()
        
        def get_24_hour_format(timezone_str: str) -> str:
            """Get current time in 24-hour format for specified timezone"""
            tz = pytz.timezone(timezone_str)
            now = datetime.now(tz)
            return now.strftime('%H:%M')
        
        # Build array of course/date combinations to process
        tasks = []
        for course in courses:
            start_date = get_date(course.timezone)
            
            for i in range(course.booking_visibility_days + 1):
                # Check if we should skip the last day based on visibility start time
                if i == course.booking_visibility_days and course.booking_visibility_start_time:
                    booking_visibility_start_time = time_string_to_minutes(
                        course.booking_visibility_start_time
                    )
                    current_time = time_string_to_minutes(get_24_hour_format(course.timezone))
                    
                    if current_time < booking_visibility_start_time:
                        continue  # Skip this date
                
                # Calculate search date
                search_date = start_date + timedelta(days=i)
                tasks.append({
                    'course': course,
                    'search_date': datetime.combine(search_date, datetime.min.time())
                })
        
        print(f"Fetching tee times for {len(tasks)} course/date combinations")
        
        # Process with concurrency and batch upserts
        UPSERT_BATCH_SIZE = 30
        results = []
        all_errors = []
        fetch_errors = []  # Track fetch errors separately
        total_tee_times = 0
        total_upsert_batches = 0
        
        # Track last logged percentage
        last_logged_percentage = -1
        
        # Helper function to upsert current results and clear memory
        async def upsert_and_clear_results():
            nonlocal results, total_tee_times, total_upsert_batches, all_errors
            
            if not results:
                return
            
            upsert_result = await batch_upsert_tee_times(supabase, results)
            total_upsert_batches += upsert_result['total_batches']
            
            # Track errors - only log if there are errors
            if upsert_result['errors']:
                all_errors.extend(upsert_result['errors'])
                print(f"Batch upsert completed with {len(upsert_result['errors'])} errors")
            
            # Count tee times before clearing
            batch_tee_times = sum(len(r['tee_times']) for r in results)
            total_tee_times += batch_tee_times
            
            # Clear results array to free memory
            results.clear()
            
            # Force garbage collection
            gc.collect()
        
        # Create a single cloudscraper instance to reuse
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'darwin',
                'desktop': True
            }
        )
        
        # Worker function to process tasks
        async def worker(task_queue: asyncio.Queue, completed_count: List[int]):
            nonlocal last_logged_percentage
            
            while True:
                try:
                    task = await task_queue.get()
                    if task is None:  # Poison pill
                        break
                    
                    course = task['course']
                    search_date = task['search_date']
                    
                    result = await fetch_course_tee_times(course, search_date, scraper)
                    
                    # Only add successful results to be saved
                    if result.get('success', False):
                        results.append(result)
                    else:
                        # Track fetch errors
                        error_info = {
                            'course_id': result['course_id'],
                            'date': result['date'],
                            'error': result.get('error', 'Unknown error')
                        }
                        fetch_errors.append(error_info)
                    
                    completed_count[0] += 1
                    
                    # Log progress at specific percentages: 0, 25, 50, 75, 99%
                    completed = completed_count[0]
                    percentage = int((completed / len(tasks)) * 100)
                    
                    # Check if we hit a milestone percentage
                    if percentage in [0, 25, 50, 75, 99] and percentage != last_logged_percentage:
                        last_logged_percentage = percentage
                        progress_msg = f"Progress: {percentage}% ({completed}/{len(tasks)})"
                        if len(fetch_errors) > 0:
                            progress_msg += f" | Fetch errors: {len(fetch_errors)}"
                        print(progress_msg)
                    
                    # Upsert to DB every UPSERT_BATCH_SIZE tasks to manage memory
                    if len(results) >= UPSERT_BATCH_SIZE:
                        await upsert_and_clear_results()
                    
                    task_queue.task_done()
                    
                except Exception as e:
                    print(f"Error processing task: {e}")
                    task_queue.task_done()
        
        # Create task queue and start workers
        task_queue = asyncio.Queue()
        for task in tasks:
            await task_queue.put(task)
        
        # Add poison pills for workers
        concurrency = 5
        for _ in range(concurrency):
            await task_queue.put(None)
        
        # Start workers
        completed_count = [0]
        workers = [
            asyncio.create_task(worker(task_queue, completed_count))
            for _ in range(concurrency)
        ]
        
        # Wait for all workers to complete
        await asyncio.gather(*workers)
        
        # Upsert any remaining results
        await upsert_and_clear_results()
        
        # Check if no tee times were found at all
        if total_tee_times == 0:
            error_msg = "No tee times found for any course/date combinations"
            print(f"ERROR: {error_msg}")
            raise ValueError(error_msg)
        
        # Check if there were any errors during fetch or batch upsert
        has_fetch_errors = len(fetch_errors) > 0
        has_upsert_errors = len(all_errors) > 0
        has_errors = has_fetch_errors or has_upsert_errors
        
        # End timer and calculate execution time
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Log final summary
        print("\n=== EXECUTION SUMMARY ===")
        print(f"Execution time: {execution_time:.2f}s")
        print(f"Total courses processed: {len(courses)}")
        print(f"Total course/date combinations: {len(tasks)}")
        print(f"Successful fetches: {len(tasks) - len(fetch_errors)}")
        print(f"Failed fetches: {len(fetch_errors)}")
        print(f"Total tee times found: {total_tee_times}")
        print(f"Database batches processed: {total_upsert_batches}")
        print(f"Database errors: {len(all_errors)}")
        print(f"Status: {'COMPLETED WITH ERRORS' if has_errors else 'SUCCESS'}")
        print("========================")
        
        response_data = {
            'statusCode': 500 if has_errors else 200,
            'body': {
                'success': not has_errors,
                'message': (
                    f'Completed with {len(fetch_errors)} fetch errors and {len(all_errors)} batch errors'
                    if has_errors
                    else 'Success'
                ),
                'fetch_errors': len(fetch_errors),
                'database_errors': len(all_errors)
            }
        }
        
        # Send health check signal
        cron_check_url = os.environ.get('CRON_CHECK_URL')
        if cron_check_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.get(cron_check_url)
            except Exception as e:
                print(f"Failed to send health check signal: {e}")
        
        return response_data
        
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        sentry_sdk.capture_exception(e)
        raise


def main():
    """Entry point for direct execution"""
    try:
        result = asyncio.run(handler())
        print('Direct execution completed')
        print(f'Result: {result}')
        sys.exit(0)
    except Exception as error:
        print(f'Direct execution failed: {error}')
        sys.exit(1)


if __name__ == '__main__':
    main()

