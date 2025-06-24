from city import City
from datetime import datetime
import asyncio
import json
from cpsgolf import CpsGolf
from chronogolf import Chronogolf
from forecast import Forecast

async def fetch_all_tee_times(dates, num_of_players, holes, cities):
    cps_golf = CpsGolf()
    chronogolf = Chronogolf()
    forecast = Forecast()
    city_forecasts = await forecast.get_organized_forecasts_by_city_and_date_async()
    
    # Run both fetches concurrently
    cps_task = cps_golf.fetch_tee_times_async(dates, num_of_players, holes, cities, city_forecasts)
    chronogolf_task = chronogolf.fetch_tee_times_async(dates, num_of_players, holes, cities, city_forecasts)
    
    # Wait for both tasks to complete
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
    tee_times.sort(key=lambda x: x.start_datetime)

    tee_times_dict = [tee_time.to_dict() for tee_time in tee_times]

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(tee_times_dict, indent=4)
    }

def test():
    # Simulate a lambda event with query parameters
    test_event = {
        "queryStringParameters": {
            "dates": datetime.now().strftime("%Y-%m-%d"),
            "numOfPlayers": "4",
            "holes": "18",
            "cities": None
        }
    }
    
    # Simulate lambda context (can be None for testing)
    test_context = None
    
    # Call the lambda handler
    response = lambda_handler(test_event, test_context)
    
    # Print the response
    print("Status Code:", response["statusCode"])
    print("Headers:", response["headers"])
    print("Body:")
    print(response["body"])

if __name__ == "__main__":
    test()