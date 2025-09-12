import posthog from 'posthog-js';
import { toast } from 'sonner';
import { TeeTime } from "../services/teeTimeService";
import { voteOnSharedTeeTime } from "../services/shareTeeTimesService";
import { StarIcon } from "@heroicons/react/24/outline";
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, 
  CloudLightning, CloudFog, Zap, CloudHail,
  CloudSunRain, CloudRainWind, Snowflake, Thermometer,
  Droplets, Navigation, Wind,
  ThumbsUp, ThumbsDown, Loader2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getTeeTime } from '@/utils/DateAndTime';

// Utility function to get formatted date and time
const getFormattedDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = getTeeTime(dateTimeString);
  return { date: dateStr, time: timeStr };
};

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
  if (!teeTime.weather_code && !teeTime.temperature && !teeTime.precipitation_probability && !teeTime.wind_speed) {
    return null;
  }

  const WeatherIcon = getWeatherIcon(teeTime.weather_code);
  const iconColor = getWeatherIconColor(teeTime.weather_code);

  return (
    <div className="flex items-center gap-1 p-1.5 bg-gradient-to-r from-slate-50 to-indigo-50 rounded border border-blue-100">
      {/* Weather Icon */}
      <div className="flex-shrink-0">
        <WeatherIcon className={`w-4 h-4 ${iconColor}`} />
      </div>
      
      {/* Weather Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Temperature */}
          {teeTime.temperature !== null && (
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-red-400" />
              <span className="font-medium text-slate-700">
                {Math.round(teeTime.temperature)}°C
              </span>
            </div>
          )}
          
          {/* Precipitation Probability */}
          {teeTime.precipitation_probability !== null && (
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span className="font-medium text-slate-700">
                {Math.round(teeTime.precipitation_probability)}%
              </span>
            </div>
          )}
          
          {/* Wind Speed */}
          {teeTime.wind_speed !== null && (
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-slate-400" />
              <span className="font-medium text-slate-700">
                {Math.round(teeTime.wind_speed * 3.6)}km/h
              </span>
            </div>
          )}
          
          {/* Weather Description */}
          {teeTime.weather_code && (
            <span className="text-slate-500 truncate">
              {teeTime.weather_code}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface TeeTimeShareCardProps {
  teeTime: TeeTime;
  index: number;
  distance?: number | null;
  onVote?: (teeTimeId: string, vote: 'approve' | 'disapprove') => void;
  userVote?: 'approve' | 'disapprove' | null;
  approvals?: string[];
  disapprovals?: string[];
  shareTeeTimeId?: number;
  clientId?: string;
  onVoteUpdate?: (shareTeeTimeId: number, approvals: number, disapprovals: number, userVote: 'approve' | 'disapprove' | null, approvalsArray?: string[], disapprovalsArray?: string[]) => void;
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
          className="absolute bottom-full mb-2 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-20 whitespace-nowrap"
          style={{ left: tooltipLeftPx ?? 0 }}
        >
          {text}
          <div
            className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"
            style={{ left: arrowLeftPx ?? 0, transform: 'translateX(-50%)' }}
          />
        </div>
      )}
    </div>
  );
};

// Vote bar component
const VoteBar = ({ approvals, disapprovals }: { approvals: number; disapprovals: number }) => {
  const total = approvals + disapprovals;
  if (total === 0) return null;
  
  const approvalPercentage = (approvals / total) * 100;
  const disapprovalPercentage = (disapprovals / total) * 100;
  
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className="h-full flex">
        {approvals > 0 && (
          <div 
            className="bg-green-500 h-full" 
            style={{ width: `${approvalPercentage}%` }}
          />
        )}
        {disapprovals > 0 && (
          <div 
            className="bg-red-500 h-full" 
            style={{ width: `${disapprovalPercentage}%` }}
          />
        )}
      </div>
    </div>
  );
};

export default function TeeTimeShareCard({ 
  teeTime, 
  index, 
  distance,
  onVote,
  approvals = [],
  disapprovals = [],
  shareTeeTimeId,
  clientId,
  onVoteUpdate
}: TeeTimeShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate counts from arrays
  const approvalsCount = approvals.length;
  const disapprovalsCount = disapprovals.length;
  
  // Determine if current client has voted
  const hasApproved = clientId ? approvals.includes(clientId) : false;
  const hasDisapproved = clientId ? disapprovals.includes(clientId) : false;
  
  const handleVote = async (vote: 'approve' | 'disapprove') => {
    // Use new voting system if shareTeeTimeId and clientId are available
    if (shareTeeTimeId && clientId && onVoteUpdate) {
      setIsLoading(true);
      
      try {
        const response = await voteOnSharedTeeTime(
          shareTeeTimeId,
          clientId,
          vote === 'approve'
        );
        
        if (response.success) {
          // Update vote counts based on response
          const newApprovals = response.updated_approvals.length;
          const newDisapprovals = response.updated_disapprovals.length;
          
          // Determine user's actual final vote state based on API response
          const userIsInApprovals = response.updated_approvals.includes(clientId);
          const userIsInDisapprovals = response.updated_disapprovals.includes(clientId);
          
          let finalUserVote: 'approve' | 'disapprove' | null = null;
          if (userIsInApprovals) {
            finalUserVote = 'approve';
          } else if (userIsInDisapprovals) {
            finalUserVote = 'disapprove';
          }
          
          onVoteUpdate(shareTeeTimeId, newApprovals, newDisapprovals, finalUserVote, response.updated_approvals, response.updated_disapprovals);
          
          // Show success toast with message from API
          toast.success(response.message);
          
          posthog.capture('tee_time_voted', {
            course_name: teeTime.course_name,
            tee_time_id: teeTime.id,
            share_tee_time_id: shareTeeTimeId,
            vote: finalUserVote || 'removed',
            price: teeTime.price
          });
        } else {
          // Show error toast if API response indicates failure
          toast.error(response.message || 'Failed to record vote');
        }
      } catch (error) {
        console.error('Error voting on shared tee time:', error);
        toast.error('Failed to record vote. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (onVote) {
      // Fallback to legacy voting system
      onVote(teeTime.id, vote);
      posthog.capture('tee_time_voted', {
        course_name: teeTime.course_name,
        tee_time_id: teeTime.id,
        vote: vote,
        price: teeTime.price
      });
    }
  };

  const { date, time } = getFormattedDateTime(teeTime.start_datetime);

  return (
    <div className="w-full">
      <div
        ref={cardRef}
        key={index}
        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden w-full max-w-full relative"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-slate-600">Casting vote...</span>
            </div>
          </div>
        )}
        <div className="p-3 w-full max-w-full">
          {/* Mobile Layout */}
          <div className="block md:hidden">
            {/* Mobile: Vertical Stack Layout */}
            <div className="space-y-3">
              {/* Row 1: Course Name and City */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 truncate mb-1">{teeTime.course_name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 truncate">{teeTime.city}</p>
                  {distance && <DistanceInfo distance={distance} />}
                </div>
              </div>

              {/* Row 2: Rating and Weather */}
              <div className="space-y-2">
                <Rating rating={teeTime.rating} />
                <WeatherInfo teeTime={teeTime} />
              </div>

              {/* Row 3: Date, Time, Details, and Price */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{date}</p>
                  <p className="text-lg font-bold text-slate-900">{time}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-1 mb-1 justify-end">
                    <span className="bg-blue-100 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                      {teeTime.holes} holes
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                      {teeTime.players_available} spots
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-700">${Number(teeTime.price).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">per person</p>
                  </div>
                </div>
              </div>

              {/* Row 4: Book Button */}
              {teeTime.booking_link && (
                <div className="pt-2">
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
                    className={`${
                      teeTime.booking_link.includes('cps')
                        ? 'w-full flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 text-center transform hover:scale-[1.02] active:scale-[0.98] bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                        : 'w-full flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 text-center transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {teeTime.booking_link.includes('cps') ? 'Book on Course Website' : 'Book on ChronoGolf'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            {/* Main Layout Container */}
            <div className="flex gap-3 h-full">
              {/* Left Content Section */}
              <div className="flex-1 min-w-0">
                {/* Top Row: Three Columns */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  {/* Left Column: Course, City, Rating */}
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-slate-900 truncate mb-1">{teeTime.course_name}</h3>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-slate-500 truncate">{teeTime.city}</p>
                      {distance && <DistanceInfo distance={distance} />}
                    </div>
                    <Rating rating={teeTime.rating} />
                    <WeatherInfo teeTime={teeTime} />
                  </div>

                  {/* Middle Column: Date and Time */}
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-slate-600 mb-1">{date}</p>
                    <p className="text-lg font-bold text-slate-900">{time}</p>
                  </div>

                  {/* Right Column: Holes, Spots, Price */}
                  <div className="flex flex-col items-end">
                    <span className="bg-blue-100 px-2 py-1 rounded-full text-xs whitespace-nowrap mb-1">
                      {teeTime.holes} holes
                    </span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs whitespace-nowrap mb-1">
                      {teeTime.players_available} spots
                    </span>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">${Number(teeTime.price).toFixed(2)}</p>
                        <p className="text-xs text-slate-500">per person</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Book Button */}
              {teeTime.booking_link && (
                <div className="flex items-stretch">
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
                    className={`${
                      teeTime.booking_link.includes('cps')
                        ? 'flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 text-center transform hover:scale-[1.02] active:scale-[0.98] bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                        : 'flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 text-center transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                    } whitespace-nowrap h-full`}
                  >
                    {teeTime.booking_link.includes('cps') ? 'Book on Course Website' : 'Book on ChronoGolf'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Line Separator */}
          <div className="border-t border-gray-200 my-3"></div>

          {/* Bottom Section: Voting Buttons */}
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="flex items-center gap-3">
              <Tooltip text="Vote Yes" containerRef={cardRef}>
                <button
                  onClick={() => handleVote('approve')}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    hasApproved
                      ? 'bg-green-800 text-white shadow-lg'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{approvalsCount}</span>
                </button>
              </Tooltip>
              
              <Tooltip text="Vote No" containerRef={cardRef}>
                <button
                  onClick={() => handleVote('disapprove')}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    hasDisapproved
                      ? 'bg-red-800 text-white shadow-lg'
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{disapprovalsCount}</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      
      {/* Vote Bar underneath the card */}
      {(approvalsCount > 0 || disapprovalsCount > 0) && (
        <div className="mt-1 px-1">
          <VoteBar approvals={approvalsCount} disapprovals={disapprovalsCount} />
        </div>
      )}
    </div>
  );
}
