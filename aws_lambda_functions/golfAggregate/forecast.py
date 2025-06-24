import asyncio
import aiohttp
from datetime import datetime, timedelta
from collections import defaultdict

from city import City


class Forecast:

    def fetch_forecast_for_all_cities_concurrently(self):
        """
        Synchronous wrapper for the async implementation
        """
        return asyncio.run(self.fetch_forecast_for_all_cities_async())

    async def fetch_forecast_for_all_cities_async(self):
        """
        Fetches the forecast for all cities concurrently using asyncio
        """
        async with aiohttp.ClientSession() as session:
            tasks = []
            for city in City:
                lat, lon = self.city_to_coordinates(city.value)
                tasks.append(self.get_meteo_forecast_async(session, lat, lon, city.value))
            
            results = await asyncio.gather(*tasks)
            return results

    def get_organized_forecasts_by_city_and_date(self):
        """
        Fetches forecasts for all cities and organizes them by city and date
        Returns a dictionary in the format:
        {
            "city_name": {
                "date_1": {
                    "hours": [],
                    "temperatures": [],
                    "precipitation_probabilities": [],
                    "weather_codes": []
                }
            }
        }
        """
        city_forecasts = self.fetch_forecast_for_all_cities_concurrently()
        result = {}
        
        for city_name, forecast_data in city_forecasts:
            result[city_name] = self._organize_forecast_by_date(forecast_data)
        
        return result

    async def get_organized_forecasts_by_city_and_date_async(self):
        """
        Async version of get_organized_forecasts_by_city_and_date
        """
        city_forecasts = await self.fetch_forecast_for_all_cities_async()
        result = {}
        
        for city_name, forecast_data in city_forecasts:
            result[city_name] = self._organize_forecast_by_date(forecast_data)
        
        return result
    
    def _organize_forecast_by_date(self, forecast_data):
        """
        Organizes hourly forecast data by date
        """
        hourly_data = forecast_data.get('hourly', {})
        times = hourly_data.get('time', [])
        temperatures = hourly_data.get('temperature_2m', [])
        precipitation_probs = hourly_data.get('precipitation_probability', [])
        weather_codes = hourly_data.get('weather_code', [])
        
        date_organized = defaultdict(lambda: {
            'hours': [],
            'temperatures': [],
            'precipitation_probabilities': [],
            'weather_codes': []
        })
        
        for i, time_str in enumerate(times):
            # Extract date and hour from time string (e.g., "2025-06-24T00:00")
            date_part = time_str.split('T')[0]  # "2025-06-24"
            hour_part = time_str.split('T')[1]  # "00:00"
            
            date_organized[date_part]['hours'].append(hour_part)
            
            if i < len(temperatures):
                date_organized[date_part]['temperatures'].append(temperatures[i])
            
            if i < len(precipitation_probs):
                date_organized[date_part]['precipitation_probabilities'].append(precipitation_probs[i])
            
            if i < len(weather_codes):
                date_organized[date_part]['weather_codes'].append(self.weather_code_to_description()[weather_codes[i]])
        
        return dict(date_organized)

    async def get_meteo_forecast_async(self, session: aiohttp.ClientSession, latitude: float, longitude: float, city_name: str):
        """
        Async version of get_meteo_forecast that returns (city_name, forecast_data) tuple
        """
        start_today = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&timezone=America/Los_Angeles&hourly=temperature_2m,precipitation_probability,weather_code&start_date={start_today}&end_date={end_date}"
        
        for attempt in range(3):
            try:
                async with session.get(url) as response:
                    response.raise_for_status()
                    data = await response.json()
                    return (city_name, data)
            except Exception as e:
                print(f"Error fetching forecast for {city_name} (attempt {attempt + 1}/3): {e}")
                if attempt < 2:  # Don't wait after the last attempt
                    await asyncio.sleep(1)
                else:
                    print(f"Failed to fetch forecast for {city_name} after 3 attempts")
                    return (city_name, {})
        
    
    def weather_code_to_description(self):
        """
        Returns a hashmap/dictionary mapping weather codes to their descriptions
        """
        return {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Depositing rime fog",
            51: "Drizzle: Light intensity",
            53: "Drizzle: Moderate intensity",
            55: "Drizzle: Dense intensity",
            56: "Freezing Drizzle: Light intensity",
            57: "Freezing Drizzle: Dense intensity",
            61: "Rain: Slight intensity",
            63: "Rain: Moderate intensity",
            65: "Rain: Heavy intensity",
            66: "Freezing Rain: Light intensity",
            67: "Freezing Rain: Heavy intensity",
            71: "Snow fall: Slight intensity",
            73: "Snow fall: Moderate intensity",
            75: "Snow fall: Heavy intensity",
            77: "Snow grains",
            80: "Rain showers: Slight intensity",
            81: "Rain showers: Moderate intensity",
            82: "Rain showers: Violent intensity",
            85: "Snow showers: Slight intensity",
            86: "Snow showers: Heavy intensity",
            95: "Thunderstorm: Slight or moderate",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
    
    def city_to_coordinates(self, city: str):
        return {
            "Vancouver": (49.26464955159312, -123.22814057376453),
            "Richmond": (49.166666666666664, -123.13333333333334),
            "Burnaby": (49.266666666666666, -122.95),
            "Surrey": (49.18333333333333, -122.85),
            "Delta": (49.18333333333333, -122.85),
            "Langley": (49.18333333333333, -122.85),
            "North Vancouver": (49.33333333333333, -123.03333333333333),
            "West Vancouver": (49.33333333333333, -123.03333333333333),
            "Coquitlam": (49.266666666666666, -122.95),
            "Port Coquitlam": (49.266666666666666, -122.95),
            "Maple Ridge": (49.216666666666665, -122.48333333333333),
            "Pitt Meadows": (49.216666666666665, -122.48333333333333),
            "Abbotsford": (49.05, -122.28333333333333),
            "Mission": (49.18333333333333, -122.31666666666666),
            "Chilliwack": (49.166666666666664, -121.96666666666667),
            "Squamish": (49.78333333333333, -123.15),
            "Whistler": (49.216666666666665, -122.98333333333333),
            "Pemberton": (49.216666666666665, -122.98333333333333),
            "Lillooet": (49.166666666666664, -121.93333333333334),
            "Williams Lake": (49.28333333333333, -122.13333333333334),
            "Prince George": (53.916666666666664, -122.75),
            "Terrace": (54.516666666666666, -128.61666666666667),
        }[city]