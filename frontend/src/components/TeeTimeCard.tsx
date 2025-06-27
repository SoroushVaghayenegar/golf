import { parseDateTimeInVancouver } from "../services/timezoneService";
import { TeeTime } from "../services/teeTimeService";
import { StarIcon } from "@heroicons/react/24/outline";
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, 
  CloudLightning, CloudFog, Zap, CloudHail,
  CloudSunRain, CloudRainWind, Snowflake, Thermometer,
  Droplets
} from 'lucide-react';

// Weather icon mapping utility
const getWeatherIcon = (weatherCode: string | null) => {
  if (!weatherCode) return Cloud;
  
  const iconMap: Record<string, React.ElementType> = {
    'Clear sky': Sun,
    'Mainly clear': Sun,
    'Partly cloudy': Cloud,
    'Overcast': Cloud,
    'Fog': CloudFog,
    'Depositing rime fog': CloudFog,
    'Drizzle: Light intensity': CloudDrizzle,
    'Drizzle: Moderate intensity': CloudDrizzle,
    'Drizzle: Dense intensity': CloudDrizzle,
    'Freezing Drizzle: Light intensity': CloudDrizzle,
    'Freezing Drizzle: Dense intensity': CloudDrizzle,
    'Rain: Slight intensity': CloudRain,
    'Rain: Moderate intensity': CloudRain,
    'Rain: Heavy intensity': CloudRain,
    'Freezing Rain: Light intensity': CloudRain,
    'Freezing Rain: Heavy intensity': CloudRain,
    'Snow fall: Slight intensity': CloudSnow,
    'Snow fall: Moderate intensity': CloudSnow,
    'Snow fall: Heavy intensity': CloudSnow,
    'Snow grains': Snowflake,
    'Rain showers: Slight intensity': CloudSunRain,
    'Rain showers: Moderate intensity': CloudRainWind,
    'Rain showers: Violent intensity': CloudRainWind,
    'Snow showers: Slight intensity': CloudSnow,
    'Snow showers: Heavy intensity': CloudSnow,
    'Thunderstorm: Slight or moderate': CloudLightning,
    'Thunderstorm with slight hail': Zap,
    'Thunderstorm with heavy hail': CloudHail,
  };
  
  return iconMap[weatherCode] || Cloud;
};

// Get weather icon color based on condition
const getWeatherIconColor = (weatherCode: string | null) => {
  if (!weatherCode) return 'text-gray-400';
  
  if (weatherCode.includes('Clear') || weatherCode.includes('Mainly clear')) {
    return 'text-yellow-500';
  }
  if (weatherCode.includes('Rain') || weatherCode.includes('Drizzle')) {
    return 'text-blue-500';
  }
  if (weatherCode.includes('Snow')) {
    return 'text-blue-200';
  }
  if (weatherCode.includes('Thunderstorm')) {
    return 'text-purple-500';
  }
  if (weatherCode.includes('Fog')) {
    return 'text-gray-400';
  }
  return 'text-gray-500';
};

// Rating component
const Rating = ({ rating }: { rating: number | null }) => {
  if (rating === null) return null;
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <StarIcon className="w-4 h-4 text-gray-300" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
      <span className="text-sm text-slate-600 ml-1">({rating.toFixed(1)})</span>
    </div>
  );
};

// Weather display component
const WeatherInfo = ({ teeTime }: { teeTime: TeeTime }) => {
  if (!teeTime.weather_code && !teeTime.temperature && !teeTime.precipitation_probability) {
    return null;
  }

  const WeatherIcon = getWeatherIcon(teeTime.weather_code);
  const iconColor = getWeatherIconColor(teeTime.weather_code);

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      {/* Weather Icon */}
      <div className="flex-shrink-0">
        <WeatherIcon className={`w-6 h-6 ${iconColor}`} />
      </div>
      
      {/* Weather Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 text-sm">
          {/* Temperature */}
          {teeTime.temperature !== null && (
            <div className="flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-red-400" />
              <span className="font-medium text-slate-700">
                {Math.round(teeTime.temperature)}°C
              </span>
            </div>
          )}
          
          {/* Precipitation Probability */}
          {teeTime.precipitation_probability !== null && (
            <div className="flex items-center gap-1">
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-slate-700">
                {Math.round(teeTime.precipitation_probability)}%
              </span>
            </div>
          )}
        </div>
        
        {/* Weather Description */}
        {teeTime.weather_code && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {teeTime.weather_code}
          </p>
        )}
      </div>
    </div>
  );
};

interface TeeTimeCardProps {
  teeTime: TeeTime;
  index: number;
}

export default function TeeTimeCard({ teeTime, index }: TeeTimeCardProps) {
  return (
    <div
      key={index}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden"
    >
      <div className="p-5">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{teeTime.course_name}</h3>
            <p className="text-sm text-slate-500 mb-2">{teeTime.city}</p>
            <Rating rating={teeTime.rating} />
          </div>
        </div>

        {/* Weather Section */}
        <WeatherInfo teeTime={teeTime} />

        {/* Tee Time Details */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold text-slate-900">
                {parseDateTimeInVancouver(teeTime.start_datetime).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'America/Vancouver'
                })}
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="bg-slate-100 px-2 py-1 rounded-full">
                  {teeTime.holes} holes
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {teeTime.players_available} spots
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                ${Number(teeTime.price).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">per person</p>
            </div>
          </div>
        </div>

        {/* Booking Button */}
        {teeTime.booking_link && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <a
              href={teeTime.booking_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 text-center block transform hover:scale-[1.02] active:scale-[0.98] ${
                teeTime.booking_link.includes('cps')
                  ? 'bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {teeTime.booking_link.includes('cps') ? 'Book on Course Website' : 'Book on ChronoGolf'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
