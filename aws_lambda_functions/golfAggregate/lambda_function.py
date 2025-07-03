import sys

sys.path.insert(0, "./python_libs")

from datetime import datetime
import json
import asyncio
from cpsgolf import CpsGolf
from chronogolf import Chronogolf
from forecast import Forecast
from supabase_client import AsyncSupabase
import aiohttp

def sort_tee_times_by_datetime(tee_times):
    return sorted(tee_times, key=lambda x: x.start_datetime)

async def fetch_all_tee_times(dates, num_of_players, holes, cities):
    forecast = Forecast()
    async_supabase = AsyncSupabase()
    
    async with aiohttp.ClientSession() as session:
        # Start Supabase fetches concurrently
        chrono_task = async_supabase.fetch_chronogolf_courses(session)
        cps_task = async_supabase.fetch_cps_courses(session)
        chrono_courses, cps_clubs = await asyncio.gather(chrono_task, cps_task)

        # Determine which cities we actually need weather for
        needed_cities = set()
        if cities:
            needed_cities.update(cities)
        else:
            # Extract cities from course data
            for course in chrono_courses:
                needed_cities.add(course["city"])
            for club in cps_clubs:
                needed_cities.add(club["city"])

        # Only fetch weather for cities we need
        weather_task = forecast.get_organized_forecasts_by_city_and_date_async(session, needed_cities)
        city_forecasts = await weather_task

        # Pass the fetched data into the constructors
        chronogolf = Chronogolf(chrono_courses)
        cps_golf = CpsGolf(cps_clubs)

        # Run both fetches concurrently using the same session
        cps_task = cps_golf.fetch_tee_times_async(session, dates, num_of_players, holes, cities, city_forecasts)
        chronogolf_task = chronogolf.fetch_tee_times_async(session, dates, num_of_players, holes, cities, city_forecasts)
        cps_tee_times, chronogolf_tee_times = await asyncio.gather(cps_task, chronogolf_task)

        return cps_tee_times + chronogolf_tee_times

def lambda_handler(event, context):
    query_params = event.get("queryStringParameters", {})
    dates = query_params.get("dates", datetime.now().strftime("%Y-%m-%d"))
    num_of_players = query_params.get("numOfPlayers", "4")
    holes = query_params.get("holes", "18")
    cities = query_params.get("cities")
    if cities:
        cities = cities.split(",")

    #change date to date object
    dates = dates.split(",")
    dates = [datetime.strptime(date, "%Y-%m-%d") for date in dates]
    num_of_players = int(num_of_players)
    holes = int(holes)

    # Run the async function
    tee_times = asyncio.run(fetch_all_tee_times(dates, num_of_players, holes, cities))
    
    # sort by datetime
    tee_times = sort_tee_times_by_datetime(tee_times)

    tee_times_dict = [tee_time.to_dict() for tee_time in tee_times]

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(tee_times_dict, indent=4)
    }
