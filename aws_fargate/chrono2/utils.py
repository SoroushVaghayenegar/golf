"""Utility functions for fetching tee times from ChronoGolf using requests with proxies"""
import asyncio
import random
from datetime import datetime
from typing import Dict, List, Any, Tuple
import requests
import sentry_sdk
import urllib3
from course import Course
from tee_time import TeeTime

# Disable SSL warnings when using proxies (proxies handle SSL verification)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED"

# Pool of user agents to rotate through
USER_AGENTS = [
    # Chrome on macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    # Firefox on macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0",
    # Safari on macOS (various versions)
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    # Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    # Firefox on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
]

# Oxylabs proxy configuration
PROXY_URL = 'https://user-teeclub_x5lyp-country-CA:TeeClubNumber+1@dc.oxylabs.io:8000'

def get_random_user_agent() -> str:
    """Get a random user agent from the pool"""
    return random.choice(USER_AGENTS)


def get_proxy() -> Dict[str, str]:
    """Get proxy configuration from Bright Data
    
    Returns a proxy configuration dict.
    """
    return {
        'http': PROXY_URL,
        'https': PROXY_URL
    }


def get_random_headers(club_id: int, user_agent: str) -> Dict[str, str]:
    """Generate randomized headers to avoid fingerprinting"""
    
    # Randomize accept-language
    languages = [
        "en-CA,en-US;q=0.9,en;q=0.8",
        "en-US,en;q=0.9",
        "en-GB,en;q=0.9,en-US;q=0.8",
        "en-CA,en;q=0.9",
    ]
    
    headers = {
        "User-Agent": user_agent,
        "Accept": "application/json",
        "Accept-Language": random.choice(languages),
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Referer": f"https://www.chronogolf.ca/en/club/{club_id}/widget?medium=widget&source=club"
    }
    
    # Randomly add some optional headers
    if random.random() > 0.3:
        headers["Cache-Control"] = "no-cache"
    
    if random.random() > 0.5:
        headers["DNT"] = "1"
    
    if random.random() > 0.4:
        headers["Pragma"] = "no-cache"
        
    return headers


async def fetch_course_tee_times(
    course: Course, 
    search_date: datetime
) -> Dict[str, Any]:
    """Fetch tee times for a specific course and date
    
    Args:
        course: Course object with external API details
        search_date: Date to search for tee times
        
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
                club_link_name=club_link_name
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
    club_link_name: str
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
        
    Returns:
        List of TeeTime objects
    """
    date_string = search_date.strftime('%Y-%m-%d')
    base_url = (
        f"https://www.chronogolf.com/marketplace/clubs/{club_id}/teetimes?"
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
            max_retries=2
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
    max_retries: int = 2
) -> List[Dict[str, Any]]:
    """Fetch URL with retry logic using requests library (async wrapper)
    
    Args:
        course_name: Name of the course (for logging)
        club_id: Club ID (for referer header)
        url: URL to fetch
        max_retries: Maximum number of retry attempts
        
    Returns:
        JSON response data
        
    Raises:
        Exception: If all retries fail
    """
    
    for attempt in range(1, max_retries + 1):
        try:
            # Get random user agent and headers for this request
            user_agent = get_random_user_agent()
            headers = get_random_headers(club_id, user_agent)
            
            # Get random proxy for this request
            proxies = get_proxy()
            
            # Run the synchronous requests call in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.get(url, headers=headers, proxies=proxies, timeout=30, verify=False)
            )
            
            if not response.ok:
                error_body = response.text[:500] if response.text else 'Unable to read response body'
                
                # Check if this is an "out of booking range" error - treat as no tee times available
                if ("out of your booking range" in error_body.lower() or 
                    "booking range" in error_body.lower()):
                    # Return empty list instead of raising exception
                    return []
                
                raise Exception(
                    f"[{course_name}] HTTP Error: {response.status_code} "
                    f"{response.reason} - {error_body} | URL: {url}"
                )
            
            return response.json()
            
        except Exception as error:
            error_details = str(error)
            
            if attempt < max_retries:
                # Simple retry without delay
                pass
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

