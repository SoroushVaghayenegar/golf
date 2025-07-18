import asyncio
import random
from datetime import datetime
from typing import Dict, List, Any 
from urllib.parse import urlencode
import aiohttp

from course import Course
from tee_time import TeeTime


CPS = "CPS"
CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED"


async def fetch_course_tee_times(course: Course, search_date: datetime) -> Dict[str, Any]:
    """Fetch tee times for a course based on its external API type."""
    try:
        if course.external_api == CPS:
            subdomain = course.external_api_attributes['subdomain']
            params = course.external_api_attributes['params']
            headers = course.external_api_attributes['headers']
            
            result = {
                'courseId': course.id,
                'date': search_date.strftime('%Y-%m-%d'),
                'teeTimes': await fetch_tee_times_from_cps(
                    course.name, subdomain, params, headers, search_date
                )
            }
        elif course.external_api == CHRONO_LIGHTSPEED:
            # For CHRONO/LIGHTSPEED, fetch tee times for each course_holes value
            course_holes_array = course.external_api_attributes['course_holes']
            club_id = course.external_api_attributes['club_id']
            course_id = course.external_api_attributes['course_id']
            affiliation_type_id = course.external_api_attributes['affiliation_type_id']
            club_link_name = course.external_api_attributes['club_link_name']

            # Parallelize fetching for each course holes value
            tasks = [
                fetch_tee_times_from_chrono_lightspeed(
                    course.name, club_id, course_id, affiliation_type_id,
                    holes, search_date, club_link_name
                )
                for holes in course_holes_array
            ]
            
            tee_times_results = await asyncio.gather(*tasks)
            all_tee_times = []
            for result in tee_times_results:
                all_tee_times.extend(result)
            
            result = {
                'courseId': course.id,
                'date': search_date.strftime('%Y-%m-%d'),
                'teeTimes': all_tee_times
            }
        else:
            raise ValueError(f"Unsupported external API: {course.external_api}")
        
        return result
    except Exception as e:
        print(f"Error fetching tee times for {course.name}: {e}")
        # Return empty result instead of re-raising
        return {
            'courseId': course.id,
            'date': search_date.strftime('%Y-%m-%d'),
            'teeTimes': []
        }


async def fetch_tee_times_from_cps(
    course_name: str,
    subdomain: str,
    params: Dict[str, Any],
    headers: Dict[str, str],
    search_date: datetime
) -> List[TeeTime]:
    """Fetch tee times from CPS API."""
    # Add the encoded date to params
    request_params = params.copy()
    request_params['searchDate'] = search_date.strftime('%a %b %d %Y')
    
    # Build the URL with query parameters
    base_url = f"https://{subdomain}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes"
    url = f"{base_url}?{urlencode(request_params)}"
    
    try:
        response = await fetch_with_retry(course_name, url, headers, 5, 21000, 2000)
        tee_times_list = response
        
        # If the response is an object with messageKey "NO_TEETIMES", return an empty array
        if (
            isinstance(tee_times_list, dict) and
            not isinstance(tee_times_list, list) and
            tee_times_list.get("messageKey") == "NO_TEETIMES"
        ):
            return []

        tee_times = []

        for tee_time_object in tee_times_list:
            # Parse time from "%Y-%m-%dT%H:%M:%S"
            start_datetime = datetime.fromisoformat(tee_time_object["startTime"].replace('Z', '+00:00'))
            players_available = len(tee_time_object["availableParticipantNo"])
            holes = tee_time_object["holes"]
            price = tee_time_object["shItemPrices"][0]["price"]
            booking_link = f"https://{subdomain}.cps.golf"
            
            tee_times.append(TeeTime(
                start_datetime=start_datetime,
                players_available=players_available,
                holes=holes,
                price=price,
                booking_link=booking_link
            ))
        
        return tee_times
    except Exception as error:
        print(f"Error: {error}")
        print(f"[{course_name}] Failed to fetch tee times from CPS after retries")
        return []


async def fetch_tee_times_from_chrono_lightspeed(
    course_name: str,
    club_id: int,
    course_id: int,
    affiliation_type_id: int,
    course_holes: int,
    search_date: datetime,
    club_link_name: str
) -> List[TeeTime]:
    """Fetch tee times from Chrono/Lightspeed API."""
    # Format to '%Y-%m-%d'
    date_string = search_date.strftime('%Y-%m-%d')
    base_url = f"https://www.chronogolf.com/marketplace/clubs/{club_id}/teetimes?date={date_string}&course_id={course_id}&nb_holes={course_holes}"
    
    tee_times_map = {}

    # Parallelize fetching for different player counts
    player_counts = [4, 3, 2, 1]
    tasks = []
    
    for players in player_counts:
        full_url = base_url
        for i in range(players):
            full_url += f"&affiliation_type_ids%5B%5D={affiliation_type_id}"
        
        task = fetch_tee_times_for_players(course_name, full_url, players)
        tasks.append(task)

    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process all results
    for result in results:
        if isinstance(result, Exception):
            continue
        
        players, tee_times = result
        for tee_time in tee_times:
            if tee_time.get("out_of_capacity") is True or len(tee_time.get("restrictions", [])) > 0:
                continue
            
            start_time = tee_time["start_time"]
            if start_time not in tee_times_map:
                tee_times_map[start_time] = tee_time
    
    tee_times = []
    for tee_time in tee_times_map.values():
        start_datetime = datetime.fromisoformat(f"{tee_time['date']}T{tee_time['start_time']}")
        players_available = len(tee_time["green_fees"])
        price = tee_time["green_fees"][0]["green_fee"]
        booking_link = get_chrono_lightspeed_booking_link(
            club_link_name, course_id, course_holes, search_date,
            affiliation_type_id, players_available, tee_time["id"]
        )
        
        tee_times.append(TeeTime(
            start_datetime=start_datetime,
            players_available=players_available,
            holes=course_holes,
            price=price,
            booking_link=booking_link
        ))
    
    return tee_times


async def fetch_tee_times_for_players(course_name: str, url: str, players: int) -> tuple[int, List[Dict[str, Any]]]:
    """Helper function to fetch tee times for a specific number of players."""
    try:
        response = await fetch_with_retry(course_name, url, {}, 5, 5000, 1000)
        tee_times = response
        return players, tee_times
    except Exception as error:
        print(f"Failed to fetch tee times from {course_name} for {players} players after retries: {error}")
        return players, []


def get_chrono_lightspeed_booking_link(
    club_link_name: str,
    course_id: int,
    nb_holes: int,
    date: datetime,
    affiliation_type_id: int,
    number_of_players: int,
    teetime_id: int
) -> str:
    """Generate booking link for Chrono/Lightspeed."""
    date_str = date.strftime('%Y-%m-%d')
    affiliation_type_ids = ','.join([str(affiliation_type_id)] * number_of_players)
    
    return (f"https://www.chronogolf.ca/club/{club_link_name}/booking/"
            f"?source=club&medium=widget#/teetime/review"
            f"?course_id={course_id}&nb_holes={nb_holes}&date={date_str}"
            f"&affiliation_type_ids={affiliation_type_ids}&teetime_id={teetime_id}"
            f"&is_deal=false&new_user=false")


async def fetch_with_retry(
    course_name: str,
    url: str,
    headers: Dict[str, str],
    max_retries: int = 5,
    max_delay: int = 19000,
    min_delay: int = 2000
) -> Any:
    """Fetch with retry logic and browser-like headers."""
    # Add headers to pretend this is from a safari browser
    headers = headers.copy()  # Don't modify the original headers
    headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors"
    })
    
    # Create a simple session with basic timeout
    timeout = aiohttp.ClientTimeout(total=30, connect=10)
    
    for attempt in range(1, max_retries + 1):
        async with aiohttp.ClientSession(timeout=timeout) as session:
            try:
                async with session.get(url, headers=headers) as response:
                    if not response.ok:
                        if response.status not in [429, 500, 503]:
                            print(f"Error fetching {course_name}: {response.status} {response.reason}")
                        raise aiohttp.ClientResponseError(
                            request_info=response.request_info,
                            history=response.history,
                            status=response.status,
                            message=f"Error fetching {course_name}: {response.status} {response.reason}"
                        )
                    # Read and return the JSON data while the connection is still open
                    return await response.json()
            except (aiohttp.ClientError, asyncio.TimeoutError, ConnectionError) as error:
                if attempt < max_retries:
                    delay = random.randint(min_delay, max_delay)
                    print(f"[{course_name}] Attempt {attempt} failed: {error}. Retrying in {delay}ms...")
                    await asyncio.sleep(delay / 1000)  # Convert to seconds
                else:
                    raise Exception(f"[{course_name}] Failed to fetch after {max_retries} attempts: {error}")
    
    raise Exception(f"[{course_name}] Failed to fetch after {max_retries} attempts")
