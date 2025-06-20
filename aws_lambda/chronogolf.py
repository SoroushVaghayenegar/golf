import asyncio
import aiohttp
from datetime import datetime, date
from tee_time import TeeTime
from typing import List
from supabase_client import Supabase

class Chronogolf:

    def __init__(self):
        self.supabase = Supabase()
        self.courses = self.supabase.fetch_chronogolf_courses().data

    def fetch_tee_times(self, search_date: date, player_count: int, holes_count: int, cities: List[str] = None) -> List[TeeTime]:
        return asyncio.run(self.fetch_tee_times_async(search_date, player_count, holes_count, cities))
    
    async def fetch_tee_times_async(self, search_date: date, player_count: int, holes_count: int, cities: List[str] = None) -> List[TeeTime]:
        async with aiohttp.ClientSession() as session:
            tasks = [self.course_tee_times(session, course, search_date, player_count, holes_count, cities) for course in self.courses]
            results = await asyncio.gather(*tasks)
        
        # Flatten the list of lists
        return [tee_time for sublist in results for tee_time in sublist]

    async def course_tee_times(self, session: aiohttp.ClientSession, course: dict, search_date, player_count, holes_count, cities: List[str] = None) -> List[TeeTime]:
        club_id = course["club_id"]
        course_id = course["course_id"]
        course_name = course["course_name"]
        affiliation_type_id = course["affiliation_type_id"]
        course_holes = course["holes"]
        city = course["city"]
        if cities and city not in cities:
            return []
        
        if holes_count not in course_holes:
            return []
        
        url = f"https://www.chronogolf.com/marketplace/clubs/{club_id}/teetimes?date={search_date.strftime('%Y-%m-%d')}&course_id={course_id}&nb_holes={holes_count}"
        for _ in range(1, player_count + 1):
            url += f"&affiliation_type_ids%5B%5D={affiliation_type_id}"
        
        
        url += f"&nb_holes={holes_count}"

        for attempt in range(3):
            try:
                async with session.get(url) as response:
                    response.raise_for_status()
                    tee_time_list = await response.json()
                    
                    tee_times = []
                    for tee_time_obj in tee_time_list:
                        if tee_time_obj["out_of_capacity"] == True or len(tee_time_obj["restrictions"]) > 0:
                            continue

                        start_time = tee_time_obj["start_time"]
                        start_date = tee_time_obj["date"]
                        start_datetime = datetime.strptime(f"{start_date} {start_time}", "%Y-%m-%d %H:%M")
                        tee_time_id = tee_time_obj["id"]
                        try:
                            tee_time = TeeTime(
                                start_date=start_datetime.date(),
                                start_time=start_datetime.time(),
                                players_available=len(tee_time_obj["green_fees"]),
                                course_name=course_name,
                                holes=holes_count,
                                price=float(tee_time_obj["green_fees"][0]["green_fee"]),
                                city=city,
                                booking_link=self.course_booking_link(course["club_link_name"], course_id, holes_count, search_date, affiliation_type_id, player_count, tee_time_id)
                            )
                            tee_times.append(tee_time)
                        except Exception as e:
                            print(tee_time_obj)
                            raise e
                    return tee_times
            except Exception as e:
                print(f"Error fetching tee times for {course_name} (attempt {attempt + 1}/3): {e}")
                if attempt < 2:  # Don't wait after the last attempt
                    await asyncio.sleep(1)
                else:
                    print(f"Failed to fetch tee times for {course_name} after 3 attempts")
                    return []
        
    
    def course_booking_link(self, club_link_name: str, course_id: int, nb_holes: int, date: date, affiliation_type_id: int, number_of_players: int, teetime_id: int) -> str:
        date_str = date.strftime("%Y-%m-%d")
        affiliation_type_ids = ",".join([str(affiliation_type_id)] * number_of_players)
        return f"https://www.chronogolf.ca/club/{club_link_name}/booking/?source=club&medium=widget#/teetime/review?course_id={course_id}&nb_holes={nb_holes}&date={date_str}&affiliation_type_ids={affiliation_type_ids}&teetime_id={teetime_id}&is_deal=false&new_user=false"
    