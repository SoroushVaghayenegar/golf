"""Local testing script for ChronoGolf tee times fetcher"""
import os
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the handler from index
from index import handler


async def main():
    """Test the handler locally"""
    print("Starting local test...")
    print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL', 'NOT SET')[:50]}...")
    print(f"REGION_ID: {os.environ.get('REGION_ID', 'NOT SET')}")
    
    try:
        result = await handler()
        print("\n=== TEST COMPLETED SUCCESSFULLY ===")
        print(f"Result: {result}")
        return result
    except Exception as e:
        print(f"\n=== TEST FAILED ===")
        print(f"Error: {e}")
        raise


if __name__ == '__main__':
    asyncio.run(main())

