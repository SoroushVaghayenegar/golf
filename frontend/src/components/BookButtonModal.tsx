"use client";

import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Clock, Users, DollarSign, Clock2,
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, 
  CloudLightning, CloudFog, Zap, CloudHail,
  CloudSunRain, CloudRainWind, Snowflake, Thermometer,
  Droplets, Wind, ChevronDown, Info, LandPlot } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader
} from '@/components/ui/dialog';
import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { type TeeTime } from '@/services/teeTimeService';
import { getTeeTime } from '@/utils/DateAndTime';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';
import React from 'react';

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

// Weather display component
const WeatherInfo = ({ teeTime }: { teeTime: TeeTime }) => {
  if (!teeTime.weather_code && !teeTime.temperature && !teeTime.precipitation_probability && !teeTime.wind_speed) {
    return null;
  }

  const WeatherIcon = getWeatherIcon(teeTime.weather_code);
  const iconColor = getWeatherIconColor(teeTime.weather_code);

  return (
    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg border border-blue-100">
      {/* Weather Icon */}
      <div className="flex-shrink-0">
        <WeatherIcon className={`w-5 h-5 ${iconColor}`} />
      </div>
      
      {/* Weather Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 text-xs flex-wrap">
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
                {Math.round(teeTime.wind_speed * 3.6)} km/h
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BookModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teeTime: TeeTime;
  numOfPlayersInFilter?: number;
}

export default function BookButtonModal({ isOpen, onOpenChange, teeTime, numOfPlayersInFilter }: BookModalProps) {
  // State for managing selected booking link when multiple options are available
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  // Determine which booking links are available
  const hasBookingLinksObject = teeTime.booking_links && Object.keys(teeTime.booking_links).length > 0;
  const hasMultipleBookingLinks = hasBookingLinksObject && Object.keys(teeTime.booking_links!).length > 1;
  const bookingLinkNumbers = hasBookingLinksObject ? Object.keys(teeTime.booking_links!).map(Number).sort((a, b) => a - b) : [];

  // Initialize selected booking number when modal opens
  React.useEffect(() => {
    if (hasBookingLinksObject && bookingLinkNumbers.length > 0 && selectedBookingNumber === null) {
      // If numOfPlayersInFilter is defined and matches an available option, select it
      if (numOfPlayersInFilter !== undefined && bookingLinkNumbers.includes(numOfPlayersInFilter)) {
        setSelectedBookingNumber(numOfPlayersInFilter);
      }
      // If numOfPlayersInFilter is undefined, don't select anything (keep selectedBookingNumber as null)
    } else if (!hasBookingLinksObject) {
      setSelectedBookingNumber(null);
    }
  }, [hasBookingLinksObject, bookingLinkNumbers, selectedBookingNumber, numOfPlayersInFilter]);

  // Reset step when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  // Compute active booking URL based on selection or single link
  const getActiveBookingUrl = (): string | null => {
    if (hasBookingLinksObject && selectedBookingNumber !== null && teeTime.booking_links) {
      return teeTime.booking_links[selectedBookingNumber] || null;
    }
    if (teeTime.booking_link) return teeTime.booking_link;
    return null;
  };

  const activeBookingUrl = getActiveBookingUrl();
  const isCps = !!activeBookingUrl && activeBookingUrl.toLowerCase().includes('cps');

  const handleBookingClick = () => {
    const bookingUrl = getActiveBookingUrl();
    if (!bookingUrl) return;
    
    // Track booking link click
    posthog.capture('booking_link_clicked', {
      course_name: teeTime.course_name,
      booking_link: bookingUrl,
      price: teeTime.price,
      available_participants: teeTime.available_participants,
      booking_source: bookingUrl.toLowerCase().includes('cps') ? 'Course Website' : 'ChronoGolf'
    });
    
    if (bookingUrl.toLowerCase().includes('cps')) {
      setStep(2);
      return;
    }
    window.open(bookingUrl, '_blank');
  };

  // Format the date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to format spots display
  const formatSpotsDisplay = (availableParticipants: number[]) => {
    if (!availableParticipants || availableParticipants.length === 0) {
      return "0 spots";
    }
    
    if (availableParticipants.length === 1) {
      return `${availableParticipants[0]} spots`;
    }
    
    const first = availableParticipants[0];
    const last = availableParticipants[availableParticipants.length - 1];
    return `${first} - ${last} spots`;
  };

  // Check if we should load the map (only when modal is open and has coordinates)
  const shouldLoadMap = isOpen && teeTime.course?.latitude && teeTime.course?.longitude;

  // Lazy load Google Maps API only when needed
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    // Only load when modal is open and has coordinates
    ...(shouldLoadMap ? {} : { preventGoogleFontsLoading: true })
  });

  // Google Maps configuration
  const mapContainerStyle = {
    width: '100%',
    height: '200px'
  };

  const center = {
    lat: teeTime.course?.latitude ? parseFloat(teeTime.course.latitude.toString()) : 0,
    lng: teeTime.course?.longitude ? parseFloat(teeTime.course.longitude.toString()) : 0
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    zoom: 12,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  // Custom marker icon using favicon
  const customMarkerIcon = {
    url: '/favicon.ico',
    scaledSize: { width: 32, height: 32 } as google.maps.Size,
    origin: { x: 0, y: 0 } as google.maps.Point,
    anchor: { x: 16, y: 32 } as google.maps.Point,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Breadcrumbs - only show on CPS step 2 */}
          {isCps && step === 2 && (
            <Breadcrumb className="mb-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); setStep(1); }}>
                    Details
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Book</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {/* Course Information (hide on CPS step 2) */}
          {(!isCps || step === 1) && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-100 rounded-lg p-4">
              <div className="mb-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {teeTime.course?.name}
                </h3>
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">{teeTime.city}</span>
              </div>
              {(teeTime.rating || (teeTime.weather_code || teeTime.temperature || teeTime.precipitation_probability || teeTime.wind_speed)) && (
                <div className="flex items-center justify-between gap-4">
                  {teeTime.rating && (
                    <div className="flex items-center gap-2">
                      <Rating value={teeTime.rating} showValue={true} size="sm" />
                    </div>
                  )}
                  <div className="flex-shrink-0">
                    <WeatherInfo teeTime={teeTime}/>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Google Map - Lazy loaded (hide on step 2 for CPS to focus on booking) */}
          {shouldLoadMap && (!isCps || step === 1) && (
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={12}
                  options={mapOptions}
                >
                  <Marker
                    position={center}
                    icon={customMarkerIcon}
                    title={teeTime.course?.name}
                  />
                </GoogleMap>
              ) : (
                <Skeleton 
                  className="w-full h-[200px] bg-gray-100"
                />
              )}
            </div>
          )}

          {/* Tee Time Details (hide on step 2 for CPS) */}
          {(!isCps || step === 1) && (
          <div className="space-y-3">
            {/* Date & Time combined and Holes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center text-gray-900 text-sm font-medium">
                  <Clock2 className="w-4 h-4 mr-2" />
                  <span>{formatDate(teeTime.start_date)} @ {getTeeTime(teeTime.start_datetime)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center text-gray-700">
                  <LandPlot className="w-4 h-4 mr-2" />
                  <span className="font-medium text-sm">Holes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">{teeTime.holes}</span>
                  {teeTime.starting_tee !== 1 && (
                    <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                      Tee {teeTime.starting_tee}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Available spots and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center text-gray-700">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="font-medium text-sm">Available</span>
                </div>
                <span className="text-blue-700 text-sm font-medium">{formatSpotsDisplay(teeTime.available_participants)}</span>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex items-center text-gray-700">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="font-medium text-sm">Price</span>
                </div>
                <span className="text-green-700 font-semibold text-sm">
                  ${Number(teeTime.price).toFixed(2)}/person
                </span>
              </div>
            </div>

          </div>
          )}

          {/* Booking Link Selector - Only in step 1 */}
          {hasMultipleBookingLinks && (!isCps || step === 1) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select booking option:
              </label>
              <div className="relative">
                <select
                  value={selectedBookingNumber || ''}
                  onChange={(e) => setSelectedBookingNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="" disabled>
                    Choose number of players
                  </option>
                  {bookingLinkNumbers.map((num) => (
                    <option key={num} value={num}>
                      {num} players
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Booking Instructions - CPS step 2, or fallback when no booking links */}
          {(isCps && step === 2) || (!hasBookingLinksObject && teeTime.booking_link && !isCps) ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">
                    Find this tee time on the course website
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    After clicking the booking button, you&apos;ll need to manually find this tee time on the course website using these details:
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock2 className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900">
                        <strong>Date:</strong> {formatDate(teeTime.start_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900">
                        <strong>Time:</strong> Start around {getTeeTime(teeTime.start_datetime).split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900">
                        <strong>Players:</strong> Set filter to {formatSpotsDisplay(teeTime.available_participants)}
                      </span>
                    </div>
                    {teeTime.holes && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </span>
                        <span className="text-blue-900">
                          <strong>Holes:</strong> Select {teeTime.holes} holes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 py-4 text-base"
            >
              Cancel
            </Button>
            {step === 1 ? (
              ((hasBookingLinksObject && selectedBookingNumber !== null) || teeTime.booking_link) ? (
                <Button
                  onClick={handleBookingClick}
                  disabled={!!(hasBookingLinksObject && selectedBookingNumber === null)}
                  className={`flex-1 py-4 text-base ${
                    isCps
                      ? 'bg-black hover:bg-gray-800 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {!isCps && <ExternalLink className="w-4 h-4 mr-2" />}
                  {isCps ? 'Book on Course Website' : 'Book on ChronoGolf'}
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    const courseName = teeTime.course?.name || teeTime.course_name;
                    if (courseName) {
                      const searchQuery = `${courseName} Vancouver golf booking`;
                      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                      window.open(searchUrl, '_blank');
                    }
                  }}
                  className="flex-1 py-4 text-base bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Find Course Website
                </Button>
              )
            ) : (
              <Button
                onClick={() => {
                  const url = getActiveBookingUrl();
                  if (url) {
                    // Track booking link click for CPS courses
                    posthog.capture('booking_link_clicked', {
                      course_name: teeTime.course_name,
                      booking_link: url,
                      price: teeTime.price,
                      available_participants: teeTime.available_participants,
                      booking_source: 'Course Website'
                    });
                    window.open(url, '_blank');
                  }
                }}
                className="flex-1 py-4 text-base bg-black hover:bg-gray-800 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Course Website
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
