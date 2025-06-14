import asyncio
import aiohttp
from datetime import datetime, date
from tee_time import TeeTime
from typing import List, Dict

class CpsGolf:

    def __init__(self):
        self.club_names = self.club_names()

    def fetch_tee_times(self, search_date, player_count, holes_count) -> List[TeeTime]:
        """
        Synchronous wrapper for the async implementation
        """
        return asyncio.run(self.fetch_tee_times_async(search_date, player_count, holes_count))

    async def fetch_tee_times_async(self, search_date: date, player_count: int, holes_count: int) -> List[TeeTime]:
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
        
        headers = {
            "x-apikey": "8ea2914e-cac2-48a7-a3e5-e0f41350bf3a",
            "Content-Type": "application/json",
            "x-componentid": "1"
        }
        
        async with aiohttp.ClientSession() as session:
            tasks = [self.club_tee_times(session, club_name, params, headers) for club_name in self.club_names]
            results = await asyncio.gather(*tasks)
            
        # Flatten the list of lists
        return [tee_time for sublist in results for tee_time in sublist]
    
    async def club_tee_times(self, session: aiohttp.ClientSession, club_name: str, params: Dict, headers: Dict) -> List[TeeTime]:
        url = f"https://{club_name}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes"
        try:
            async with session.get(url, params=params, headers=headers) as response:
                response.raise_for_status()
                tee_time_list = await response.json()
                
                # Check if response indicates no tee times available
                if isinstance(tee_time_list, dict) and tee_time_list.get("messageKey") == "NO_TEETIMES":
                    return []
                    
                tee_times = []
                for tee_time_obj in tee_time_list:
                    start_datetime = datetime.strptime(tee_time_obj["startTime"], "%Y-%m-%dT%H:%M:%S")
                    
                    tee_time = TeeTime(
                        start_date=start_datetime.date(),
                        start_time=start_datetime.time(),
                        players_available=len(tee_time_obj["availableParticipantNo"]),
                        course_name=tee_time_obj.get("courseName", ""),
                        holes=tee_time_obj.get("holes"),
                        price=float(tee_time_obj["shItemPrices"][0]["price"])
                    )
                    tee_times.append(tee_time)
                return tee_times
                
        except Exception as e:
            print(f"Error fetching tee times for {club_name}: {e}")
            return []
    
    def club_names(self):
        return [
            "golfvancouver",
            "golfburnaby",
            "northview",
            "westcoastgolfgroup",
            "fortlangley",
            "redwoodsbc",
            "morgancreekbc"
        ]