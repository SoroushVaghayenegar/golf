"""Utility functions for fetching tee times from ChronoGolf using cloudscraper"""
import asyncio
import random
from datetime import datetime
from typing import Dict, List, Any, Tuple
import cloudscraper
import sentry_sdk
from course import Course
from tee_time import TeeTime


CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED"


async def fetch_course_tee_times(
    course: Course, 
    search_date: datetime,
    scraper: cloudscraper.CloudScraper
) -> Dict[str, Any]:
    """Fetch tee times for a specific course and date
    
    Args:
        course: Course object with external API details
        search_date: Date to search for tee times
        scraper: CloudScraper instance for making requests
        
    Returns:
        Dictionary with course_id, date, list of tee times, and success status
        If there's an error, includes 'error' key with error message
        
    Raises:
        ValueError: If external API is not supported
    """
    if course.external_api != CHRONO_LIGHTSPEED:
        raise ValueError(f"Unsupported external API: {course.external_api}")
    
    try:
        # Extract ChronoGolf API attributes
        course_holes_array = course.external_api_attributes['course_holes']
        club_id = course.external_api_attributes['club_id']
        course_id = course.external_api_attributes['course_id']
        affiliation_type_id = course.external_api_attributes['affiliation_type_id']
        club_link_name = course.external_api_attributes['club_link_name']
        
        # Fetch tee times for each holes configuration in parallel
        tasks = []
        for holes in course_holes_array:
            task = fetch_tee_times_from_chrono_lightspeed(
                db_course_id=course.id,
                course_name=course.name,
                club_id=club_id,
                course_id=course_id,
                affiliation_type_id=affiliation_type_id,
                course_holes=holes,
                search_date=search_date,
                club_link_name=club_link_name,
                scraper=scraper
            )
            tasks.append(task)
        
        # Gather all results - this will raise if any task fails
        tee_times_results = await asyncio.gather(*tasks)
        all_tee_times = []
        for result in tee_times_results:
            all_tee_times.extend(result)
        
        return {
            'course_id': course.id,
            'date': search_date.strftime('%Y-%m-%d'),
            'tee_times': [tt.to_dict() for tt in all_tee_times],
            'success': True
        }
    except Exception as e:
        error_msg = f"Error fetching tee times for course {course.name} on {search_date.strftime('%Y-%m-%d')}: {str(e)}"
        print(f"ERROR: {error_msg}")
        return {
            'course_id': course.id,
            'date': search_date.strftime('%Y-%m-%d'),
            'tee_times': [],
            'success': False,
            'error': error_msg
        }


async def fetch_tee_times_from_chrono_lightspeed(
    db_course_id: int,
    course_name: str,
    club_id: int,
    course_id: int,
    affiliation_type_id: int,
    course_holes: int,
    search_date: datetime,
    club_link_name: str,
    scraper: cloudscraper.CloudScraper
) -> List[TeeTime]:
    """Fetch tee times from ChronoGolf/Lightspeed API for a specific configuration
    
    Args:
        db_course_id: Database course ID
        course_name: Name of the course
        club_id: ChronoGolf club ID
        course_id: ChronoGolf course ID
        affiliation_type_id: Affiliation type ID for bookings
        course_holes: Number of holes (9, 18, etc.)
        search_date: Date to search for tee times
        club_link_name: Club link name for booking URLs
        scraper: CloudScraper instance for making requests
        
    Returns:
        List of TeeTime objects
    """
    date_string = search_date.strftime('%Y-%m-%d')
    base_url = (
        f"https://www.chronogolf.ca/marketplace/clubs/{club_id}/teetimes?"
        f"date={date_string}&course_id={course_id}&nb_holes={course_holes}"
    )
    
    # Map to store unique tee times by start time
    tee_times_map: Dict[str, Dict[str, Any]] = {}
    
    # Fetch for different player counts (1-4 players) in parallel
    player_counts = [4, 3, 2, 1]
    tasks = []
    
    for players in player_counts:
        # Build URL with affiliation type IDs for each player
        full_url = base_url
        for _ in range(players):
            full_url += f"&affiliation_type_ids%5B%5D={affiliation_type_id}"
        
        task = fetch_with_retry_async(
            course_name=course_name,
            club_id=club_id,
            url=full_url,
            scraper=scraper,
            max_retries=2,
            max_delay=2000,
            min_delay=500
        )
        tasks.append((players, task))
    
    # Gather all results - if any task fails, the exception will propagate up
    results = []
    for players, task in tasks:
        tee_times_data = await task
        results.append({'players': players, 'tee_times': tee_times_data})
    
    # Process all results to build tee times map
    for result in results:
        tee_times_data = result['tee_times']
        for tee_time_data in tee_times_data:
            # Skip if out of capacity or has restrictions
            if tee_time_data.get('out_of_capacity') or tee_time_data.get('restrictions'):
                continue
            
            start_time = tee_time_data['start_time']
            if start_time not in tee_times_map:
                tee_time_data['available_participants'] = [len(tee_time_data['green_fees'])]
                tee_times_map[start_time] = tee_time_data
            else:
                temp_tee_time = tee_times_map[start_time]
                temp_tee_time['available_participants'].append(len(tee_time_data['green_fees']))
    
    # Convert map to TeeTime objects
    tee_times: List[TeeTime] = []
    for tee_time_data in tee_times_map.values():
        start_datetime = f"{tee_time_data['date']}T{tee_time_data['start_time']}"
        players_available = len(tee_time_data['green_fees'])
        available_participants = sorted(tee_time_data['available_participants'])
        price = tee_time_data['green_fees'][0]['green_fee']
        
        # Generate booking links
        booking_link = get_chrono_lightspeed_booking_link(
            club_link_name=club_link_name,
            course_id=course_id,
            nb_holes=course_holes,
            date=search_date,
            affiliation_type_id=affiliation_type_id,
            number_of_players=players_available,
            teetime_id=tee_time_data['id']
        )
        
        booking_links = get_chrono_lightspeed_booking_links(
            club_link_name=club_link_name,
            course_id=course_id,
            nb_holes=course_holes,
            date=search_date,
            affiliation_type_id=affiliation_type_id,
            available_participants=available_participants,
            teetime_id=tee_time_data['id']
        )
        
        # Generate unique tee time ID
        date_str = tee_time_data['date'].replace('-', '')
        time_str = tee_time_data['start_time'].replace(':', '')
        tee_time_id = f"{db_course_id}{date_str}{time_str}-{course_holes}"
        
        tee_time = TeeTime(
            start_datetime=start_datetime,
            players_available=players_available,
            available_participants=available_participants,
            holes=course_holes,
            price=price,
            booking_link=booking_link,
            booking_links=booking_links,
            tee_time_id=tee_time_id
        )
        tee_times.append(tee_time)
    
    # Sort by start datetime
    tee_times.sort(key=lambda tt: tt.start_datetime)
    
    return tee_times


def get_chrono_lightspeed_booking_links(
    club_link_name: str,
    course_id: int,
    nb_holes: int,
    date: datetime,
    affiliation_type_id: int,
    available_participants: List[int],
    teetime_id: int
) -> Dict[int, str]:
    """Generate booking links for different player counts
    
    Args:
        club_link_name: Club link name in ChronoGolf
        course_id: Course ID
        nb_holes: Number of holes
        date: Booking date
        affiliation_type_id: Affiliation type ID
        available_participants: List of available player counts
        teetime_id: Tee time ID
        
    Returns:
        Dictionary mapping player count to booking link
    """
    booking_links = {}
    for number_of_players in available_participants:
        booking_links[number_of_players] = get_chrono_lightspeed_booking_link(
            club_link_name=club_link_name,
            course_id=course_id,
            nb_holes=nb_holes,
            date=date,
            affiliation_type_id=affiliation_type_id,
            number_of_players=number_of_players,
            teetime_id=teetime_id
        )
    return booking_links


def get_chrono_lightspeed_booking_link(
    club_link_name: str,
    course_id: int,
    nb_holes: int,
    date: datetime,
    affiliation_type_id: int,
    number_of_players: int,
    teetime_id: int
) -> str:
    """Generate a booking link for ChronoGolf
    
    Args:
        club_link_name: Club link name in ChronoGolf
        course_id: Course ID
        nb_holes: Number of holes
        date: Booking date
        affiliation_type_id: Affiliation type ID
        number_of_players: Number of players
        teetime_id: Tee time ID
        
    Returns:
        Booking URL string
    """
    date_str = date.strftime('%Y-%m-%d')
    affiliation_type_ids = ','.join([str(affiliation_type_id)] * number_of_players)
    
    return (
        f"https://www.chronogolf.ca/club/{club_link_name}/booking/"
        f"?source=club&medium=widget#/teetime/review?course_id={course_id}"
        f"&nb_holes={nb_holes}&date={date_str}"
        f"&affiliation_type_ids={affiliation_type_ids}"
        f"&teetime_id={teetime_id}&is_deal=false&new_user=false"
    )


async def fetch_with_retry_async(
    course_name: str,
    club_id: int,
    url: str,
    scraper: cloudscraper.CloudScraper,
    max_retries: int = 5,
    max_delay: int = 19000,
    min_delay: int = 2000
) -> List[Dict[str, Any]]:
    """Fetch URL with retry logic using cloudscraper (async wrapper)
    
    Args:
        course_name: Name of the course (for logging)
        club_id: Club ID (for referer header)
        url: URL to fetch
        scraper: CloudScraper instance
        max_retries: Maximum number of retry attempts
        max_delay: Maximum delay between retries (ms)
        min_delay: Minimum delay between retries (ms)
        
    Returns:
        JSON response data
        
    Raises:
        Exception: If all retries fail
    """
    # Headers to mimic Safari browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
        "Accept": "application/json",
        "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Referer": f"https://www.chronogolf.com/en/club/{club_id}/widget?medium=widget&source=club"
    }
    
    for attempt in range(1, max_retries + 1):
        try:
            # Add random delay BEFORE each request (not just retries)
            if attempt == 1:  # Only on first attempt, not retries
                pre_request_delay = random.uniform(0.2, 0.5)  # 500ms-2s
                await asyncio.sleep(pre_request_delay)
            
            # Run the synchronous cloudscraper request in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: scraper.get(url, headers=headers, timeout=30)
            )
            
            if not response.ok:
                error_body = response.text[:500] if response.text else 'Unable to read response body'
                raise Exception(
                    f"[{course_name}] HTTP Error: {response.status_code} "
                    f"{response.reason} - {error_body} | URL: {url}"
                )
            
            return response.json()
            
        except Exception as error:
            error_details = str(error)
            
            if attempt < max_retries:
                # Random delay between min_delay and max_delay (convert ms to seconds)
                delay = (random.randint(min_delay, max_delay)) / 1000.0
                await asyncio.sleep(delay)
            else:
                # Report to Sentry on final failure
                sentry_sdk.capture_exception(error)
                raise Exception(
                    f"[{course_name}] Failed to fetch after {max_retries} attempts - "
                    f"Final error: {error_details} | URL: {url}"
                )
    
    # This should never be reached
    raise Exception(f"[{course_name}] Failed to fetch after {max_retries} attempts")


async def batch_upsert_tee_times(
    supabase_client,
    results: List[Dict[str, Any]],
    batch_size: int = 100
) -> Dict[str, Any]:
    """Batch upsert tee times data to Supabase
    
    Args:
        supabase_client: Supabase client instance
        results: List of results from fetch_course_tee_times
        batch_size: Number of records per batch
        
    Returns:
        Dictionary with summary of operation (total_processed, total_batches, errors)
    """
    # Transform results into upsert format
    upsert_data = []
    for result in results:
        upsert_data.append({
            'course_id': result['course_id'],
            'date': result['date'],
            'tee_times_data': result['tee_times'],
            'tee_times_count': len(result['tee_times']),
            'updated_at': datetime.utcnow().isoformat()
        })
    
    total_records = len(upsert_data)
    total_batches = (total_records + batch_size - 1) // batch_size
    errors = []
    
    # Process in batches
    for i in range(total_batches):
        start_index = i * batch_size
        end_index = min(start_index + batch_size, total_records)
        batch = upsert_data[start_index:end_index]
        
        try:
            # Use Supabase upsert with conflict resolution
            response = supabase_client.table('tee_times').upsert(
                batch,
                on_conflict='course_id,date'
            ).execute()
            
        except Exception as error:
            error_msg = f"Batch {i + 1}/{total_batches} failed: {str(error)}"
            print(f"ERROR: {error_msg}")
            errors.append({'batch': i + 1, 'error': error_msg})
    
    result = {
        'total_processed': total_records,
        'total_batches': total_batches,
        'errors': errors
    }
    
    return result


def time_string_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes since midnight
    
    Args:
        time_str: Time string in format "HH:MM"
        
    Returns:
        Total minutes since midnight
    """
    hours, minutes = map(int, time_str.split(':'))
    return hours * 60 + minutes

