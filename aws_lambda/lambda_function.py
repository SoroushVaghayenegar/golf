import sys
sys.path.insert(0, "./python_libs")


from datetime import datetime
import json
import asyncio
from cpsgolf import CpsGolf
from chronogolf import Chronogolf

async def fetch_all_tee_times(date, num_of_players, holes):
    cps_golf = CpsGolf()
    chronogolf = Chronogolf()
    
    # Run both fetches concurrently
    cps_task = cps_golf.fetch_tee_times_async(date, num_of_players, holes)
    chronogolf_task = chronogolf.fetch_tee_times_async(date, num_of_players, holes)
    
    # Wait for both tasks to complete
    cps_tee_times, chronogolf_tee_times = await asyncio.gather(cps_task, chronogolf_task)
    
    return cps_tee_times + chronogolf_tee_times

def lambda_handler(event, context):
    query_params = event.get("queryStringParameters", {})
    date = query_params.get("date", datetime.now().strftime("%Y-%m-%d"))
    num_of_players = query_params.get("numOfPlayers", "4")
    holes = query_params.get("holes", "18")

    #change date to date object
    date = datetime.strptime(date, "%Y-%m-%d")
    num_of_players = int(num_of_players)
    holes = int(holes)

    # Run the async function
    tee_times = asyncio.run(fetch_all_tee_times(date, num_of_players, holes))
    
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
