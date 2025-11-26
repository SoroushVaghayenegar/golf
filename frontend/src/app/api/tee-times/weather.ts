import { SupabaseClient } from "@supabase/supabase-js";
import { ForecastData } from "./types";

/**
 * Fetch forecast data from Supabase for given cities and dates
 */
export async function fetchForecasts(
  supabase: SupabaseClient,
  cityIds: number[],
  dates: string[]
): Promise<ForecastData[]> {
  if (cityIds.length === 0 || dates.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("forecasts")
    .select("*")
    .in("city_id", cityIds)
    .in("date", dates);

  if (error) {
    console.warn("Failed to fetch forecasts:", error);
    return [];
  }

  return data || [];
}

/**
 * Get forecast numeric value for a specific metric at a given time
 */
export function getForecastNumber(
  forecastData: ForecastData | undefined,
  metricName: string,
  startTime: string
): number | null {
  if (!forecastData || !forecastData[metricName] || !startTime) {
    return null;
  }

  const metric = forecastData[metricName];
  if (
    !metric ||
    typeof metric !== "object" ||
    !("data" in metric) ||
    !Array.isArray(metric.data) ||
    metric.data.length !== 24
  ) {
    return null;
  }

  // Parse hour and minute from start_time (HH:MM format)
  const [hourStr, minuteStr] = startTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  // If time is after hour:30, use the next hour
  let targetHour = hour;
  if (minute > 30) {
    targetHour = (hour + 1) % 24;
  }

  const value = metric.data[targetHour];
  return value !== null && value !== undefined ? Number(value) : null;
}

/**
 * Maps weather code to descriptive string
 */
export function getWeatherDescription(weatherCode: number | null): string | null {
  if (weatherCode === null || weatherCode === undefined) {
    return null;
  }

  const weatherCodeMap: { [key: number]: string } = {
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
    99: "Thunderstorm with heavy hail",
  };

  return weatherCodeMap[weatherCode] || `Unknown weather code: ${weatherCode}`;
}

export interface WeatherData {
  temperature: number | null;
  precipitation_probability: number | null;
  weather_code: string | null;
  wind_speed: number | null;
  wind_gusts: number | null;
  cloud_cover: number | null;
  uv_index: number | null;
  precipitation: number | null;
}

/**
 * Get weather data for a specific time from forecast
 */
export function getWeatherData(forecast: ForecastData | undefined, startTime: string): WeatherData {
  return {
    temperature: getForecastNumber(forecast, "temperature_2m", startTime),
    precipitation_probability: getForecastNumber(forecast, "precipitation_probability", startTime),
    weather_code: getWeatherDescription(getForecastNumber(forecast, "weather_code", startTime)),
    wind_speed: getForecastNumber(forecast, "wind_speed_10m", startTime),
    wind_gusts: getForecastNumber(forecast, "wind_gusts_10m", startTime),
    cloud_cover: getForecastNumber(forecast, "cloud_cover", startTime),
    uv_index: getForecastNumber(forecast, "uv_index", startTime),
    precipitation: getForecastNumber(forecast, "precipitation", startTime),
  };
}

