import posthog from 'posthog-js';
import { TeeTime } from "../services/teeTimeService";
import { StarIcon } from "@heroicons/react/24/outline";
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, 
  CloudLightning, CloudFog, Zap, CloudHail,
  CloudSunRain, CloudRainWind, Snowflake, Thermometer,
  Droplets, X
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getTeeTime } from '@/utils/DateAndTime';

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
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg border border-blue-100">
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
  onRemoveCourse: (courseName: string) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

// Simple tooltip component
const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-20 whitespace-nowrap">
          {text}
          <div className="absolute bottom-full right-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default function TeeTimeCard({ teeTime, index, onRemoveCourse, onVisibilityChange }: TeeTimeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (!onVisibilityChange || hasBeenVisible) return;

    const currentCardRef = cardRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenVisible) {
            setHasBeenVisible(true);
            onVisibilityChange(true);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the card is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before the card is fully in view
      }
    );

    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, [index, onVisibilityChange, hasBeenVisible]);

  const handleRemoveCourse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    posthog.capture('course_removed_from_filters', {
      course_name: teeTime.course_name,
      city: teeTime.city,
    });
    onRemoveCourse(teeTime.course_name);
  };

  return (
    <div
      ref={cardRef}
      key={index}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden w-full max-w-full"
    >
      <div className="p-5 w-full max-w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <div className="flex items-start gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-900 flex-1 min-w-0 truncate">{teeTime.course_name}</h3>
              <Tooltip text="Remove course from filters">
                <button
                  onClick={handleRemoveCourse}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors duration-200 group ml-1 mt-0.5"
                  aria-label="Remove course from filters"
                >
                  <X className="w-4 h-4 text-gray-500 group-hover:text-red-500" />
                </button>
              </Tooltip>
            </div>
            <p className="text-sm text-slate-500 mb-2 truncate">{teeTime.city}</p>
            <Rating rating={teeTime.rating} />
          </div>
        </div>

        {/* Weather Section */}
        <div className="w-full max-w-full overflow-hidden">
          <WeatherInfo teeTime={teeTime} />
        </div>

        {/* Tee Time Details */}
        <div className="flex flex-col gap-3 mt-4 w-full max-w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-xl font-bold text-slate-900">
                {getTeeTime(teeTime.start_datetime)}
              </p>
              <div className="flex items-center gap-2 sm:gap-4 text-sm text-slate-600 flex-wrap">
                <span className="bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {teeTime.holes} holes
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                  {teeTime.players_available} spots
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl sm:text-2xl font-bold text-green-700">
                ${Number(teeTime.price).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 whitespace-nowrap">per person</p>
            </div>
          </div>
        </div>

        {/* Booking Button */}
        {teeTime.booking_link && (
          <div className="mt-5 pt-4 border-t border-gray-100 w-full max-w-full">
            <a
              href={teeTime.booking_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                posthog.capture('booking_link_clicked', {
                  course_name: teeTime.course_name,
                  booking_link: teeTime.booking_link,
                  price: teeTime.price,
                  players_available: teeTime.players_available,
                  booking_source: teeTime.booking_link?.includes('cps') ? 'Course Website' : 'ChronoGolf'
                });
              }}
              className={`w-full px-4 py-3 font-semibold rounded-lg transition-all duration-200 text-center block transform hover:scale-[1.02] active:scale-[0.98] max-w-full overflow-hidden ${
                teeTime.booking_link.includes('cps')
                  ? 'bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <span className="truncate block">
                {teeTime.booking_link.includes('cps') ? 'Book on Course Website' : 'Book on ChronoGolf'}
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
