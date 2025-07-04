import asyncio
import aiohttp
from datetime import datetime, date
from tee_time import TeeTime
from typing import List

class Chronogolf:

    def __init__(self, courses):
        self.courses = courses

    def fetch_tee_times(self, search_dates: List[date], player_count: int, holes_count: int, cities: List[str] = None, city_forecasts: dict = None) -> List[TeeTime]:
        return asyncio.run(self.fetch_tee_times_async(None, search_dates, player_count, holes_count, cities, city_forecasts))
    
    async def fetch_tee_times_async(self, session: aiohttp.ClientSession, search_dates: List[date], player_count: int, holes_count: int, cities: List[str] = None, city_forecasts: dict = None) -> List[TeeTime]:
        # Use provided session or create new one
        should_close_session = session is None
        if session is None:
            session = aiohttp.ClientSession()
        
        try:
            # Create tasks for each course and date combination
            tasks = []
            for search_date in search_dates:
                for course in self.courses:
                    tasks.append(self.course_tee_times(session, course, search_date, player_count, holes_count, cities, city_forecasts))
            
            results = await asyncio.gather(*tasks)
            
            # Flatten the list of lists
            return [tee_time for sublist in results for tee_time in sublist]
        finally:
            if should_close_session:
                await session.close()

    async def course_tee_times(self, session: aiohttp.ClientSession, course: dict, search_date, player_count, holes_count, cities: List[str] = None, city_forecasts: dict = None) -> List[TeeTime]:
        club_id = course["club_id"]
        course_id = course["course_id"]
        course_name = course["course_name"]
        course_display_name = course["course_display_name"]
        affiliation_type_id = course["affiliation_type_id"]
        course_holes = course["holes"]
        city = course["city"]
        rating = course["rating"]
        cart_girl_hotness = course["cart_girl_hotness"]
        
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
                        weather_hour_to_use = start_datetime.hour
                        if start_datetime.minute > 30:
                            weather_hour_to_use += 1 # if it's after 30 minutes of that hour, use the next hour
                        
                        weather_hour_to_use = weather_hour_to_use % 24
                        weather_hour_to_use = weather_hour_to_use - 1 # if it's 0, use 23
                        
                        # if city ot start_date is not found, then return null
                        if city not in city_forecasts or start_date not in city_forecasts[city]:
                            weather_code = None
                            temperature = None
                            precipitation_probability = None
                        else:
                            weather_code = city_forecasts[city][start_date]['weather_codes'][weather_hour_to_use]
                            temperature = city_forecasts[city][start_date]['temperatures'][weather_hour_to_use]
                            precipitation_probability = city_forecasts[city][start_date]['precipitation_probabilities'][weather_hour_to_use]

                        try:
                            tee_time = TeeTime(
                                start_date=start_datetime.date(),
                                start_time=start_datetime.time(),
                                players_available=len(tee_time_obj["green_fees"]),
                                course_name=course_display_name,
                                holes=holes_count,
                                price=float(tee_time_obj["green_fees"][0]["green_fee"]),
                                city=city,
                                booking_link=self.course_booking_link(course["club_link_name"], course_id, holes_count, search_date, affiliation_type_id, player_count, tee_time_id),
                                rating=rating,
                                cart_girl_hotness=cart_girl_hotness,
                                temperature=temperature,
                                precipitation_probability=precipitation_probability,
                                weather_code=weather_code
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
    