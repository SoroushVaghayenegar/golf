import asyncio
import aiohttp
from datetime import datetime, date
from tee_time import TeeTime
from typing import List, Dict
from supabase_client import Supabase

class CpsGolf:

    def __init__(self):
        self.supabase = Supabase()
        self.clubs = self.supabase.fetch_cps_courses().data

    def fetch_tee_times(self, search_dates: List[date], player_count, holes_count, cities: List[str] = None) -> List[TeeTime]:
        """
        Synchronous wrapper for the async implementation
        """
        return asyncio.run(self.fetch_tee_times_async(search_dates, player_count, holes_count, cities))

    async def fetch_tee_times_async(self, search_dates: List[date], player_count: int, holes_count: int, cities: List[str] = None) -> List[TeeTime]:
        headers = {
            "x-apikey": "8ea2914e-cac2-48a7-a3e5-e0f41350bf3a",
            "Content-Type": "application/json",
            "x-componentid": "1"
        }
        
        async with aiohttp.ClientSession() as session:
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
                    tasks.append(self.club_tee_times(session, club, params, headers, cities))
            
            results = await asyncio.gather(*tasks)
            
        # Flatten the list of lists
        return [tee_time for sublist in results for tee_time in sublist]
    
    
    async def club_tee_times(self, session: aiohttp.ClientSession, club: dict, params: Dict, headers: Dict, cities: List[str] = None) -> List[TeeTime]:
        club_name = club["club_name"]
        course_name = club["course_name"]
        course_display_name = club["course_display_name"]
        city = club["city"]
        rating = club["rating"]
        cart_girl_hotness = club["cart_girl_hotness"]
        
        url = f"https://{club_name}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes"
        
        for attempt in range(3):
            try:
                async with session.get(url, params=params, headers=headers) as response:
                    response.raise_for_status()
                    tee_time_list = await response.json()
                    
                    # Check if response indicates no tee times available
                    if isinstance(tee_time_list, dict) and tee_time_list.get("messageKey") == "NO_TEETIMES":
                        return []
                        
                    tee_times = []
                    for tee_time_obj in tee_time_list:
                        if tee_time_obj["courseName"].strip() != course_name.strip():
                            continue
                        if cities and city not in cities:
                            continue
                        start_datetime = datetime.strptime(tee_time_obj["startTime"], "%Y-%m-%dT%H:%M:%S")
                        
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
                            cart_girl_hotness=cart_girl_hotness
                        )
                        tee_times.append(tee_time)
                    return tee_times
                    
            except Exception as e:
                print(f"Error fetching tee times for {club_name} (attempt {attempt + 1}/3): {e}")
                if attempt < 2:  # Don't wait after the last attempt
                    await asyncio.sleep(1)
                else:
                    print(f"Failed to fetch tee times for {club_name} after 3 attempts")
        
        return []
        