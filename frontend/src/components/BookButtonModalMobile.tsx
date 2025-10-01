"use client";

import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Clock, Users, DollarSign,
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, 
  CloudLightning, CloudFog, Zap, CloudHail,
  CloudSunRain, CloudRainWind, Snowflake, Thermometer,
  Droplets, Wind, Info, LandPlot, Star, ArrowLeft, BadgeInfo } from 'lucide-react';
import Link from 'next/link';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { type TeeTime } from '@/services/teeTimeService';
import { getTeeTime } from '@/utils/DateAndTime';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import React from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// Weather icon mapping utility (reused from BookButtonModal)
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

interface BookModalMobileProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teeTime: TeeTime;
  numOfPlayersInFilter?: number;
}

export default function BookButtonModalMobile({ isOpen, onOpenChange, teeTime, numOfPlayersInFilter }: BookModalMobileProps) {
  // State for managing selected booking link when multiple options are available
  const [selectedBookingNumber, setSelectedBookingNumber] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Determine which booking links are available
  const hasBookingLinksObject = teeTime.booking_links && Object.keys(teeTime.booking_links).length > 0;
  const hasMultipleBookingLinks = hasBookingLinksObject && Object.keys(teeTime.booking_links!).length > 1;
  const bookingLinkNumbers = hasBookingLinksObject ? Object.keys(teeTime.booking_links!).map(Number).sort((a, b) => a - b) : [];

  // Initialize selected booking number when modal opens
  React.useEffect(() => {
    if (hasBookingLinksObject && bookingLinkNumbers.length > 0 && selectedBookingNumber === null) {
      if (numOfPlayersInFilter !== undefined && bookingLinkNumbers.includes(numOfPlayersInFilter)) {
        setSelectedBookingNumber(numOfPlayersInFilter);
      } else {
        setSelectedBookingNumber(bookingLinkNumbers[0]);
      }
    } else if (!hasBookingLinksObject) {
      setSelectedBookingNumber(null);
    }
  }, [hasBookingLinksObject, bookingLinkNumbers, selectedBookingNumber, numOfPlayersInFilter]);

  // Reset instructions when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowInstructions(false);
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
      booking_source: bookingUrl.toLowerCase().includes('cps') ? 'Course Website' : 'ChronoGolf',
      device_type: 'mobile'
    });
    
    if (bookingUrl.toLowerCase().includes('cps')) {
      setShowInstructions(true);
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
      return "0";
    }
    
    if (availableParticipants.length === 1) {
      return `${availableParticipants[0]}`;
    }
    
    const first = availableParticipants[0];
    const last = availableParticipants[availableParticipants.length - 1];
    return `${first}-${last}`;
  };

  const WeatherIcon = getWeatherIcon(teeTime.weather_code);
  const iconColor = getWeatherIconColor(teeTime.weather_code);

  // Check if we should load the map (only when modal is open and has coordinates)
  const shouldLoadMap = isOpen && teeTime.course?.latitude && teeTime.course?.longitude;

  const center = {
    lat: teeTime.course?.latitude ? parseFloat(teeTime.course.latitude.toString()) : 0,
    lng: teeTime.course?.longitude ? parseFloat(teeTime.course.longitude.toString()) : 0
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] px-4 pb-6">
        <DrawerHeader className="px-0 pt-3 pb-2">
          <VisuallyHidden>
            <DrawerTitle>Tee time booking</DrawerTitle>
          </VisuallyHidden>
        </DrawerHeader>
        
        <div className="space-y-3 overflow-y-auto">
          {/* Back Button - Show on instructions page */}
          {showInstructions && (
            <button
              onClick={() => setShowInstructions(false)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors py-2 -mt-1"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all">
                <ArrowLeft className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Back to Details</span>
            </button>
          )}

          {/* Course Header - Compact */}
          {!showInstructions && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-100 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-base text-gray-900">
                  {teeTime.course?.name}
                </h3>
                {teeTime.course?.slug && (
                  <Link
                    href={`/course/${teeTime.course.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all shadow-sm hover:shadow group flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title="View course details"
                  >
                    <BadgeInfo className="w-3 h-3" />
                    <span className="text-xs font-medium">Course Info</span>
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{teeTime.city}</span>
                </div>
                {teeTime.rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-gray-700">{teeTime.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Google Map - Compact for mobile */}
          {shouldLoadMap && !showInstructions && (
            <div className="bg-gray-50 rounded-lg overflow-hidden w-full h-[150px] [&_.gm-style-cc]:!hidden [&_a[href^='https://maps.google.com']]:!hidden [&_.gmnoprint]:!hidden [&_.gm-style-cc+div]:!hidden [&_button[aria-label*='Zoom']]:!block [&_div[aria-label='Zoom']]:!block">
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
                <Map
                  defaultCenter={center}
                  defaultZoom={12}
                  disableDefaultUI={true}
                  zoomControl={true}
                  mapId="booking-modal-map-mobile"
                  clickableIcons={true}
                  gestureHandling="greedy"
                  styles={[
                    {
                      featureType: "poi",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }]
                    }
                  ]}
                >
                  <AdvancedMarker position={center} title={teeTime.course?.name}>
                    <img 
                      src="/favicon.ico" 
                      alt="Course location marker" 
                      style={{ width: 32, height: 32 }}
                    />
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            </div>
          )}

          {/* Compact Info Grid */}
          {!showInstructions && (
            <div className="grid grid-cols-2 gap-2">
              {/* Date & Time */}
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center text-gray-600 mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs font-medium">Time</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {getTeeTime(teeTime.start_datetime)}
                </div>
                <div className="text-xs text-gray-600">
                  {formatDate(teeTime.start_date)}
                </div>
              </div>

              {/* Holes */}
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center text-gray-600 mb-1">
                  <LandPlot className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs font-medium">Holes</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {teeTime.holes} holes
                </div>
                {teeTime.starting_tee !== 1 && (
                  <div className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    Tee {teeTime.starting_tee}
                  </div>
                )}
              </div>

              {/* Available Spots */}
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center text-gray-600 mb-1">
                  <Users className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs font-medium">Spots</span>
                </div>
                <div className="text-sm font-semibold text-blue-700">
                  {formatSpotsDisplay(teeTime.available_participants)} available
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center text-gray-600 mb-1">
                  <DollarSign className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs font-medium">Price</span>
                </div>
                <div className="text-sm font-semibold text-green-700">
                  ${Number(teeTime.price).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">per person</div>
              </div>
            </div>
          )}

          {/* Weather - Compact */}
          {!showInstructions && (teeTime.weather_code || teeTime.temperature || teeTime.precipitation_probability || teeTime.wind_speed) && (
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg border border-blue-100">
              <WeatherIcon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {teeTime.temperature !== null && (
                  <div className="flex items-center gap-0.5">
                    <Thermometer className="w-3 h-3 text-red-400" />
                    <span className="font-medium text-slate-700">
                      {Math.round(teeTime.temperature)}°C
                    </span>
                  </div>
                )}
                {teeTime.precipitation_probability !== null && (
                  <div className="flex items-center gap-0.5">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span className="font-medium text-slate-700">
                      {Math.round(teeTime.precipitation_probability)}%
                    </span>
                  </div>
                )}
                {teeTime.wind_speed !== null && (
                  <div className="flex items-center gap-0.5">
                    <Wind className="w-3 h-3 text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {Math.round(teeTime.wind_speed * 3.6)} km/h
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Link Selector - Compact */}
          {hasMultipleBookingLinks && !showInstructions && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">
                Select players:
              </label>
              <select
                value={selectedBookingNumber || ''}
                onChange={(e) => setSelectedBookingNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
            </div>
          )}

          {/* CPS Instructions - Compact for mobile */}
          {showInstructions && isCps && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-sm text-blue-900">
                    Find this tee time
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Look for this tee time on the course website:
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-blue-900">
                        <strong>Date:</strong> {formatDate(teeTime.start_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-blue-900">
                        <strong>Time:</strong> Around {getTeeTime(teeTime.start_datetime).split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-blue-900">
                        <strong>Players:</strong> {formatSpotsDisplay(teeTime.available_participants)}
                      </span>
                    </div>
                    {teeTime.holes && (
                      <div className="flex items-center gap-1.5">
                        <LandPlot className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-blue-900">
                          <strong>Holes:</strong> {teeTime.holes} holes
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 py-3 text-sm"
            >
              Cancel
            </Button>
            {!showInstructions ? (
              ((hasBookingLinksObject && selectedBookingNumber !== null) || teeTime.booking_link) ? (
                <Button
                  onClick={handleBookingClick}
                  disabled={!!(hasBookingLinksObject && selectedBookingNumber === null)}
                  className={`flex-1 py-3 text-sm ${
                    isCps
                      ? 'bg-black hover:bg-gray-800 text-white disabled:bg-gray-400'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white disabled:from-gray-400 disabled:to-gray-400'
                  }`}
                >
                  {!isCps && <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
                  {isCps ? 'Book on Course Site' : 'Book on Chronogolf'}
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
                  className="flex-1 py-3 text-sm bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Find Course
                </Button>
              )
            ) : (
              <Button
                onClick={() => {
                  const url = getActiveBookingUrl();
                  if (url) {
                    posthog.capture('booking_link_clicked', {
                      course_name: teeTime.course_name,
                      booking_link: url,
                      price: teeTime.price,
                      available_participants: teeTime.available_participants,
                      booking_source: 'Course Website',
                      device_type: 'mobile'
                    });
                    window.open(url, '_blank');
                  }
                }}
                className="flex-1 py-3 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Book
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

