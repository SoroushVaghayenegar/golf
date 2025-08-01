import asyncio
import aiohttp
import random
from datetime import datetime, date
from tee_time import TeeTime
from typing import List, Dict

username = 'ttimesgolf_Bw3Ck'
password = 'T_timesgolf1'


PROXIES = [
   "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8001",
   "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8002",
   "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8003",
   "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8004",
   "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8005",
   "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8001",
   "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8002",
   "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8003",
   "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8004",
   "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8005"
]

class CpsGolf:

    def __init__(self, clubs):
        self.clubs = clubs

    def fetch_tee_times(self, search_dates: List[date], player_count, holes_count, cities: List[str] = None, city_forecasts: dict = None) -> List[TeeTime]:
        """
        Synchronous wrapper for the async implementation
        """
        return asyncio.run(self.fetch_tee_times_async(None, search_dates, player_count, holes_count, cities, city_forecasts))

    async def fetch_tee_times_async(self, session: aiohttp.ClientSession, search_dates: List[date], player_count: int, holes_count: int, cities: List[str] = None, city_forecasts: dict = None) -> List[TeeTime]:
        headers = {
            "x-apikey": "8ea2914e-cac2-48a7-a3e5-e0f41350bf3a",
            "Content-Type": "application/json",
            "x-componentid": "1"
        }
        
        # Use provided session or create new one
        should_close_session = session is None
        if session is None:
            session = aiohttp.ClientSession()
        
        try:
            # Create tasks for each club and date combination
            tasks = []
            for search_date in search_dates:
                params = {
                    "searchDate": search_date.strftime("%a %b %d %Y"),
                    "holes": str(holes_count),
                    "numberOfPlayer": str(player_count),
                    "courseIds": "2,1,3",
                    "searchTimeType": "0",
                    "teeOffTimeMin": "0",
                    "teeOffTimeMax": "23",
                    "isChangeTeeOffTime": "true",
                    "teeSheetSearchView": "5",
                    "classCode": "R",
                    "defaultOnlineRate": "N",
                    "isUseCapacityPricing": "false",
                    "memberStoreId": "1",
                    "searchType": "1"
                }
                
                for club in self.clubs:
                    tasks.append(self.club_tee_times(session, club, params, headers, cities, city_forecasts))
            
            results = await asyncio.gather(*tasks)
            
            # Flatten the list of lists
            return [tee_time for sublist in results for tee_time in sublist]
        finally:
            if should_close_session:
                await session.close()
    
    
    async def club_tee_times(self, session: aiohttp.ClientSession, club: dict, params: Dict, headers: Dict, cities: List[str] = None, city_forecasts: dict = None) -> List[TeeTime]:
        club_name = club["club_name"]
        course_name = club["course_name"]
        course_display_name = club["course_display_name"]
        city = club["city"]
        rating = club["rating"]
        cart_girl_hotness = club["cart_girl_hotness"]
        
        url = f"https://{club_name}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes"
        
        for attempt in range(3):
            try:
                print(f"Fetching tee times for {club_name}")
                async with session.get(url, params=params, headers=headers, proxy=random.choice(PROXIES)) as response:
                    response.raise_for_status()
                    tee_time_list = await response.json()
                    
                    # Check if response indicates no tee times available
                    if isinstance(tee_time_list, dict) and tee_time_list.get("messageKey") == "NO_TEETIMES":
                        return []
                        
                    tee_times = []
                    print(f"Found {len(tee_time_list)} tee times for {club_name}")
                    for tee_time_obj in tee_time_list:
                        if tee_time_obj["courseName"].strip() != course_name.strip():
                            continue
                        if cities and city not in cities:
                            continue
                        start_datetime = datetime.strptime(tee_time_obj["startTime"], "%Y-%m-%dT%H:%M:%S")
                        start_date = str(start_datetime.date())
                        weather_hour_to_use = start_datetime.hour
                        if start_datetime.minute > 30:
                            weather_hour_to_use += 1 # if it's after 30 minutes of that hour, use the next hour
                        
                        weather_hour_to_use = weather_hour_to_use % 24
                        weather_hour_to_use = weather_hour_to_use - 1 # if it's 0, use 23
                        
                        if city not in city_forecasts or start_date not in city_forecasts[city]:
                            weather_code = None
                            temperature = None
                            precipitation_probability = None
                        else:
                            weather_code = city_forecasts[city][start_date]['weather_codes'][weather_hour_to_use]
                            temperature = city_forecasts[city][start_date]['temperatures'][weather_hour_to_use]
                            precipitation_probability = city_forecasts[city][start_date]['precipitation_probabilities'][weather_hour_to_use]

                        tee_time = TeeTime(
                            start_date=start_datetime.date(),
                            start_time=start_datetime.time(),
                            players_available=len(tee_time_obj["availableParticipantNo"]),
                            course_name=course_display_name,
                            holes=tee_time_obj.get("holes"),
                            price=float(tee_time_obj["shItemPrices"][0]["price"]),
                            city=city,
                            booking_link=f"https://{club_name}.cps.golf",
                            club_name=club_name,
                            rating=rating,
                            cart_girl_hotness=cart_girl_hotness,
                            temperature=temperature,
                            precipitation_probability=precipitation_probability,
                            weather_code=weather_code
                        )
                        tee_times.append(tee_time)
                    return tee_times
                    
            except Exception as e:
                print(f"Error fetching tee times for {club_name} (attempt {attempt + 1}/3): {e}")
                if attempt < 2:  # Don't wait after the last attempt
                    await asyncio.sleep(random.randint(1, 3))
                else:
                    print(f"Failed to fetch tee times for {club_name} after 3 attempts")
        
        return []
        