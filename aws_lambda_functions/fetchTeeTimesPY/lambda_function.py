import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any

from course import Course
from supabase_client import SupabaseClient
from utils import fetch_course_tee_times, CPS, CHRONO_LIGHTSPEED

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler function for fetching tee times from all courses.
    
    Expected event structure:
    {
        // No specific course data needed - fetches all courses from database
    }
    
    Returns:
    {
        "statusCode": 200,
        "body": {
            "success": true,
            "executionTime": 1234.56
        }
    }
    """
    try:
        # Start timer
        start_time = time.time()
        
        # Create Supabase client and fetch all courses
        supabase_client = SupabaseClient()
        courses = supabase_client.fetch_courses_by_api_type(CHRONO_LIGHTSPEED)
        
        logger.info(f"Fetched {len(courses)} courses from database")
        
        # Get current date in Vancouver timezone
        def get_vancouver_date():
            import pytz
            vancouver_tz = pytz.timezone('America/Vancouver')
            vancouver_time = datetime.now(vancouver_tz)
            return vancouver_time.replace(hour=0, minute=0, second=0, microsecond=0)
        
        start_date = get_vancouver_date()
        
        # Import asyncio and run the async function
        import asyncio
        
        # Create event loop and run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Process all courses and dates in parallel
            promises = []
            for course in courses:
                for i in range(course.booking_visibility_days + 1):
                    search_date = start_date + timedelta(days=i)
                    promises.append(fetch_course_tee_times(course, search_date))
            
            # Wait for all promises to complete
            results = loop.run_until_complete(asyncio.gather(*promises, return_exceptions=True))
            
            # Log any exceptions that occurred
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Error in promise {i}: {result}")
            
        finally:
            loop.close()
        
        # End timer and calculate execution time
        end_time = time.time()
        execution_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        logger.info(f"Successfully processed {len(courses)} courses in {execution_time:.2f}ms")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'executionTime': execution_time,
                'count': len(results),
                'first': results[0]
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}'
            })
        }


def test_lambda_handler():
    """
    Test function to simulate the lambda handler.
    This can be used for local testing.
    """
    print("Testing lambda_handler with all courses from database...")
    
    # Test event (no specific course data needed)
    test_event = {}
    
    result = lambda_handler(test_event, None)
    print(f"Result: {json.dumps(result, indent=2, default=str)}")


if __name__ == "__main__":
    # Run test if executed directly
    test_lambda_handler() 