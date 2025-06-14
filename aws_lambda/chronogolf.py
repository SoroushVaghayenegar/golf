import asyncio
import aiohttp
from datetime import datetime, date
from tee_time import TeeTime
from typing import List

class Chronogolf:

    def __init__(self):
        self.courses = self.courses()

    def fetch_tee_times(self, search_date: date, player_count: int, holes_count: int) -> List[TeeTime]:
        return asyncio.run(self.fetch_tee_times_async(search_date, player_count, holes_count))
    
    async def fetch_tee_times_async(self, search_date: date, player_count: int, holes_count: int) -> List[TeeTime]:
        async with aiohttp.ClientSession() as session:
            tasks = [self.course_tee_times(session, course, search_date, player_count, holes_count) for course in self.courses]
            results = await asyncio.gather(*tasks)
        
        # Flatten the list of lists
        return [tee_time for sublist in results for tee_time in sublist]

    async def course_tee_times(self, session: aiohttp.ClientSession, course: dict, search_date, player_count, holes_count) -> List[TeeTime]:
        club_id = course["id"]
        course_id = course["course_id"]
        club_name = course["name"]
        affiliation_type_id = course["affiliation_type_id"]
        course_holes = course["holes"]

        if holes_count not in course_holes:
            return []
        
        url = f"https://www.chronogolf.com/marketplace/clubs/{club_id}/teetimes?date={search_date.strftime('%Y-%m-%d')}&course_id={course_id}&nb_holes={holes_count}"
        for _ in range(1, player_count + 1):
            url += f"&affiliation_type_ids%5B%5D={affiliation_type_id}"
        
        
        url += f"&nb_holes={holes_count}"

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
                    try:
                        tee_time = TeeTime(
                            start_date=start_datetime.date(),
                            start_time=start_datetime.time(),
                            players_available=len(tee_time_obj["green_fees"]),
                            course_name=club_name,
                            holes=holes_count,
                            price=float(tee_time_obj["green_fees"][0]["green_fee"])
                        )
                        tee_times.append(tee_time)
                    except Exception as e:
                        print(tee_time_obj)
                        raise e
                return tee_times
        except Exception as e:
            print(f"Error fetching tee times for {club_name}: {e}")
            return []
        
    
    def courses(self):
        return [
        {
            "id": 545,
            "course_id": 525,
            "name": "University Golf Club",
            "affiliation_type_id": 2897,
            "holes": [18]
        },
        {
            "id": 582,
            "course_id": 562,
            "name": "Musqueam Golf & Learning Academy",
            "affiliation_type_id": 3045,
            "holes": [18]
        },
        {
            "id": 17201,
            "course_id": 19690,
            "name": "Savage Creek Golf Club",
            "affiliation_type_id": 95601,
            "holes": [16]
        },
        {
            "id": 701,
            "course_id": 688,
            "name": "Country Meadows Golf Club",
            "affiliation_type_id": 3521,
            "holes": [18]
        },
        {
            "id": 18945,
            "course_id": 23119,
            "name": "Mylora Executive Golf Club",
            "affiliation_type_id": 112546,
            "holes": [9, 18]
        },
        {
            "id": 19476,
            "course_id": 27231,
            "name": "GreenTee (Langley) Country Club",
            "affiliation_type_id": 135347,
            "holes": [9, 18]
        },
        {
            "id": 17078,
            "course_id": 19550,
            "name": "GreenTee The Sky Course (Langley)",
            "affiliation_type_id": 71596,
            "holes": [18]
        },
        {
            "id": 80,
            "course_id": 91,
            "name": "Meadow Gardens Golf Club",
            "affiliation_type_id": 92,
            "holes": [18]
        },
        {
            "id": 679,
            "course_id": 664,
            "name": "Golden Eagle Golf Club (North Course)",
            "affiliation_type_id": 3433,
            "holes": [18]
        },
        {
            "id": 679,
            "course_id": 665,
            "name": "Golden Eagle Golf Club (South Course)",
            "affiliation_type_id": 3433,
            "holes": [18]
        },
        {
            "id": 542,
            "course_id": 522,
            "name": "Furry Creek Golf & Country Club",
            "affiliation_type_id": 2885,
            "holes": [18]
        },
        {
            "id": 734,
            "course_id": 722,
            "name": "Surrey Golf Club (Main Course)",
            "affiliation_type_id": 3653,
            "holes": [18]
        },
        {
            "id": 734,
            "course_id": 27356,
            "name": "Surrey Golf Club (Willows 9)",
            "affiliation_type_id": 3653,
            "holes": [9, 18]
        }
    ]