from city import City
from datetime import datetime
import asyncio
from cpsgolf import CpsGolf
from chronogolf import Chronogolf

async def fetch_all_tee_times(date, num_of_players, holes, cities):
    cps_golf = CpsGolf()
    chronogolf = Chronogolf()
    
    # Run both fetches concurrently
    cps_task = cps_golf.fetch_tee_times_async(date, num_of_players, holes, cities)
    chronogolf_task = chronogolf.fetch_tee_times_async(date, num_of_players, holes, cities)
    
    # Wait for both tasks to complete
    cps_tee_times, chronogolf_tee_times = await asyncio.gather(cps_task, chronogolf_task)
    
    return cps_tee_times + chronogolf_tee_times

def test():
    date = datetime.now().strftime("%Y-%m-%d")
    num_of_players = "4"
    holes = "18"
    cities = "Vancouver,Burnaby".split(",")

    #change date to date object
    date = datetime.strptime(date, "%Y-%m-%d")
    num_of_players = int(num_of_players)
    holes = int(holes)

    # Run the async function
    tee_times = asyncio.run(fetch_all_tee_times(date, num_of_players, holes, cities))
    
    # sort by datetime
    tee_times.sort(key=lambda x: x.start_datetime)

    tee_times_dict = [tee_time.to_dict() for tee_time in tee_times]

    print(tee_times_dict)

if __name__ == "__main__":
    test()