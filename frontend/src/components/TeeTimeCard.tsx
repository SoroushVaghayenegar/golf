import posthog from 'posthog-js';
import { TeeTime } from "../services/teeTimeService";
import { StarIcon } from "@heroicons/react/24/outline";
import BookButton from '@/components/BookButton';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, 
  CloudLightning, CloudFog, Zap, CloudHail,
  CloudSunRain, CloudRainWind, Snowflake, Thermometer,
  Droplets, X, Navigation, Wind,
  HeartPlus,
  HeartMinus
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getTeeTime } from '@/utils/DateAndTime';
import { useAppStore } from '@/stores/appStore';

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

// Helper function to format spots display based on available_participants array
const formatSpotsDisplay = (availableParticipants: number[]) => {
  if (!availableParticipants || availableParticipants.length === 0) {
    return "0 spots";
  }
  
  if (availableParticipants.length === 1) {
    return `${availableParticipants[0]} spots`;
  }
  
  // Use first and last items for multiple values
  const first = availableParticipants[0];
  const last = availableParticipants[availableParticipants.length - 1];
  return `${first} - ${last} spots`;
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
  if (!teeTime.weather_code && !teeTime.temperature && !teeTime.precipitation_probability && !teeTime.wind_speed) {
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
        <div className="flex items-center gap-4 text-sm flex-wrap">
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
          
          {/* Wind Speed */}
          {teeTime.wind_speed !== null && (
            <div className="flex items-center gap-1">
              <Wind className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">
                {Math.round(teeTime.wind_speed * 3.6)} km/h
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
  onRemoveCourse: (courseId: number, courseName?: string) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  distance?: number | null;
  numOfPlayersInFilter?: number;
}

// Distance display component
const DistanceInfo = ({ distance }: { distance: number }) => {
  // Convert meters to kilometers
  const distanceKm = distance / 1000;
  
  // Format distance nicely
  let displayText: string;
  if (distanceKm < 1) {
    // Show in meters if less than 1km
    displayText = `${Math.round(distance)}m`;
  } else if (distanceKm < 10) {
    // Show one decimal place for distances under 10km
    displayText = `${distanceKm.toFixed(1)}km`;
  } else {
    // Show whole numbers for distances over 10km
    displayText = `${Math.round(distanceKm)}km`;
  }
  
  return (
    <div className="flex items-center gap-1 text-xs text-slate-500">
      <Navigation className="w-3 h-3" />
      <span>{displayText}</span>
    </div>
  );
};

// Simple tooltip component with smart clamping inside a container
const Tooltip = ({ children, text, containerRef }: { children: React.ReactNode; text: string; containerRef?: React.RefObject<HTMLElement | null> | React.RefObject<HTMLDivElement | null> }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipLeftPx, setTooltipLeftPx] = useState<number | null>(null);
  const [arrowLeftPx, setArrowLeftPx] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    const wrapperEl = wrapperRef.current;
    const tooltipEl = tooltipRef.current;
    const containerEl = containerRef?.current;
    if (!wrapperEl || !tooltipEl || !containerEl) return;

    // Compute desired center position relative to the page
    const wrapperRect = wrapperEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    // Force layout to ensure tooltip has size
    const tooltipRect = tooltipEl.getBoundingClientRect();

    const triggerCenterX = wrapperRect.left + (wrapperRect.width / 2);
    const desiredLeft = triggerCenterX - (tooltipRect.width / 2);

    const padding = 8; // Keep a small margin from card edges
    const minLeft = containerRect.left + padding;
    const maxLeft = containerRect.right - tooltipRect.width - padding;

    const clampedLeft = Math.max(minLeft, Math.min(desiredLeft, maxLeft));

    // Convert page-based left to wrapper-relative left
    const relativeLeft = clampedLeft - wrapperRect.left;
    setTooltipLeftPx(relativeLeft);

    // Arrow should point to the trigger center but stay inside tooltip bounds
    const centerWithinTooltip = triggerCenterX - clampedLeft;
    const arrowPadding = 10;
    const arrowLeft = Math.max(arrowPadding, Math.min(centerWithinTooltip, tooltipRect.width - arrowPadding));
    setArrowLeftPx(arrowLeft);
  }, [isVisible, containerRef]);

  return (
    <div 
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute top-full mt-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-20 whitespace-nowrap"
          style={{ left: tooltipLeftPx ?? 0 }}
        >
          {text}
          <div
            className="absolute bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"
            style={{ left: arrowLeftPx ?? 0, transform: 'translateX(-50%)' }}
          />
        </div>
      )}
    </div>
  );
};

export default function TeeTimeCard({ teeTime, index, onRemoveCourse, onVisibilityChange, distance, numOfPlayersInFilter }: TeeTimeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  
  // Share functionality
  const { addTeeTimeToShare, removeTeeTimeFromShare, isTeeTimeInShareList, isShareFull } = useAppStore();

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
    onRemoveCourse(Number(teeTime.course_id), teeTime.course_name);
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
            <div className="flex items-start">
              <h3 className="text-lg font-semibold text-slate-900 min-w-0 truncate">{teeTime.course_name}</h3>
              <Tooltip text="Remove course from filters" containerRef={cardRef} >
                <button
                  onClick={handleRemoveCourse}
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors duration-200 group ml-1 mt-0.5"
                  aria-label="Remove course from filters"
                >
                  <X className="w-3 h-3 text-red-400 group-hover:text-red-500" />
                </button>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-sm text-slate-500 truncate">{teeTime.city}</p>
              {distance && <DistanceInfo distance={distance} />}
            </div>
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
                  {formatSpotsDisplay(teeTime.available_participants)}
                </span>
                {teeTime.starting_tee !== 1 && (
                  <span className="bg-orange-400 text-white px-2 py-1 rounded-full whitespace-nowrap">
                    Tee {teeTime.starting_tee}
                  </span>
                )}
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

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-gray-100 w-full max-w-full">
          <div className="flex gap-2 w-full">
            {/* Book Button */}
            <div className="flex-1 min-w-0">
              <BookButton teeTime={teeTime} numOfPlayersInFilter={numOfPlayersInFilter} />
            </div>
            
            {/* Share Button */}
            <button
              onClick={() => {
                const isInShareList = isTeeTimeInShareList(teeTime.id);
                if (isInShareList) {
                  removeTeeTimeFromShare(teeTime.id);
                  posthog.capture('tee_time_removed_from_share', {
                    course_name: teeTime.course_name,
                    tee_time_id: teeTime.id,
                    price: teeTime.price
                  });
                } else if (!isShareFull()) {
                  addTeeTimeToShare(teeTime);
                  posthog.capture('tee_time_added_to_share', {
                    course_name: teeTime.course_name,
                    tee_time_id: teeTime.id,
                    price: teeTime.price
                  });
                }
              }}
              disabled={!isTeeTimeInShareList(teeTime.id) && isShareFull()}
              className={`flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 ${
                !isTeeTimeInShareList(teeTime.id) && isShareFull()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isTeeTimeInShareList(teeTime.id)
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isTeeTimeInShareList(teeTime.id) ? (
                <>
                  <span>Share</span>
                  <HeartMinus className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Share</span>
                  <HeartPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
