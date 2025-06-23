"use client";
import { forwardRef, useRef, useImperativeHandle } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { type TeeTime } from "../services/teeTimeService";
import { 
  parseDateTimeInVancouver,
  getVancouverToday,
  getVancouverNow
} from "../services/timezoneService";
import { SubscriptionSignup } from "@/components/SubscriptionSignup";
import LottiePlayer from "@/components/LottiePlayer";
import TeeTimeCard from "@/components/TeeTimeCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TeeTimeCardsProps {
  teeTimes: TeeTime[];
  loading: boolean;
  error: string | null;
  timeRange: number[];
  citiesFilterEnabled: boolean;
  selectedCities: string[];
  coursesFilterEnabled: boolean;
  selectedCourses: string[];
  fetchedDates: Date[] | undefined;
  sortBy: 'startTime' | 'priceAsc' | 'priceDesc' | 'rating';
  setSortBy: (sortBy: 'startTime' | 'priceAsc' | 'priceDesc' | 'rating') => void;
  showSubscription: boolean;
  setShowSubscription: (show: boolean) => void;
  handleSubscriptionDismiss: () => void;
  isMobile: boolean;
  hasSearched: boolean;
}

export interface TeeTimeCardsRef {
  scrollableElement: HTMLDivElement | null;
  sectionElement: HTMLElement | null;
}

const TeeTimeCards = forwardRef<TeeTimeCardsRef, TeeTimeCardsProps>(({
  teeTimes,
  loading,
  error,
  timeRange,
  citiesFilterEnabled,
  selectedCities,
  coursesFilterEnabled,
  selectedCourses,
  fetchedDates,
  sortBy,
  setSortBy,
  showSubscription,
  setShowSubscription,
  handleSubscriptionDismiss,
  isMobile,
  hasSearched
}, ref) => {
  
  const sectionRef = useRef<HTMLElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);

  // Expose both refs to parent component
  useImperativeHandle(ref, () => ({
    scrollableElement: scrollableRef.current,
    sectionElement: sectionRef.current,
  }), []);

  const filteredTeeTimes = (teeTimes: TeeTime[]) => {
    let filtered = teeTimes;
    
    // Filter by time range
    filtered = filtered.filter(teeTime => {
      const teeTimeDateTime = parseDateTimeInVancouver(teeTime.start_datetime);
      const teeTimeHour = teeTimeDateTime.getHours();
      return teeTimeHour >= timeRange[0] && teeTimeHour <= timeRange[1];
    });
    
    // Filter by cities if enabled
    if (citiesFilterEnabled && selectedCities.length > 0) {
      filtered = filtered.filter(teeTime => selectedCities.includes(teeTime.city));
    }
    
    // Filter by courses if enabled
    if (coursesFilterEnabled && selectedCourses.length > 0) {
      filtered = filtered.filter(teeTime => selectedCourses.includes(teeTime.course_name));
    }
    
    // If any of the fetched dates is today, filter out tee times that are earlier than now
    if (fetchedDates && fetchedDates.length > 0) {
      const vancouverToday = getVancouverToday();
      const hasTodaySelected = fetchedDates.some(date => 
        date.toDateString() === vancouverToday.toDateString()
      );
      
      if (hasTodaySelected) {
        const vancouverNow = getVancouverNow();
        filtered = filtered.filter(teeTime => {
          const teeTimeDateTime = parseDateTimeInVancouver(teeTime.start_datetime);
          const teeTimeDate = new Date(teeTimeDateTime.getFullYear(), teeTimeDateTime.getMonth(), teeTimeDateTime.getDate());
          
          // If this tee time is for today, check if it's in the future
          if (teeTimeDate.toDateString() === vancouverToday.toDateString()) {
            return teeTimeDateTime >= vancouverNow;
          }
          // If it's not today, include it
          return true;
        });
      }
    }
    
    // Sort tee times
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'startTime':
          const timeA = parseDateTimeInVancouver(a.start_datetime);
          const timeB = parseDateTimeInVancouver(b.start_datetime);
          return timeA.getTime() - timeB.getTime();
        case 'priceAsc':
          return Number(a.price) - Number(b.price);
        case 'priceDesc':
          return Number(b.price) - Number(a.price);
        case 'rating':
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Group tee times by date
  const groupTeeTimesByDate = (teeTimes: TeeTime[]) => {
    const grouped = teeTimes.reduce((acc, teeTime) => {
      const teeTimeDateTime = parseDateTimeInVancouver(teeTime.start_datetime);
      const dateKey = teeTimeDateTime.toDateString();
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(teeTime);
      
      return acc;
    }, {} as Record<string, TeeTime[]>);

    // Sort dates chronologically
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedDates.map(dateKey => ({
      date: dateKey,
      teeTimes: grouped[dateKey]
    }));
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = getVancouverToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  return (
    <section ref={sectionRef} className="flex-1 flex flex-col lg:h-full lg:overflow-hidden">
      {/* Sort By Component - Only show when there are results */}
      {!loading && !error && filteredTeeTimes(teeTimes).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Sort By</span>
            <Listbox value={sortBy} onChange={setSortBy}>
              <div className="relative">
                <Listbox.Button className="px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-200 transition-colors min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 text-sm">
                      {sortBy === 'startTime' && 'Start Time'}
                      {sortBy === 'priceAsc' && 'Price (Low to High)'}
                      {sortBy === 'priceDesc' && 'Price (High to Low)'}
                      {sortBy === 'rating' && 'Rating'}
                    </span>
                    <div className="flex items-center gap-1">
                      {sortBy === 'startTime' && <ArrowUp className="w-3 h-3 text-slate-500" />}
                      {sortBy === 'priceAsc' && <ArrowUp className="w-3 h-3 text-slate-500" />}
                      {sortBy === 'priceDesc' && <ArrowDown className="w-3 h-3 text-slate-500" />}
                      {sortBy === 'rating' && <ArrowDown className="w-3 h-3 text-slate-500" />}
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-auto focus:outline-none max-h-60 min-w-[200px]">
                  <Listbox.Option
                    value="startTime"
                    className={({ active }) =>
                      `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                        active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="font-medium">Start Time</span>
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                  <Listbox.Option
                    value="priceAsc"
                    className={({ active }) =>
                      `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                        active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="font-medium">Price (Low to High)</span>
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                  <Listbox.Option
                    value="priceDesc"
                    className={({ active }) =>
                      `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                        active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="font-medium">Price (High to Low)</span>
                        <div className="flex items-center gap-1">
                          <ArrowDown className="w-3 h-3" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                  <Listbox.Option
                    value="rating"
                    className={({ active }) =>
                      `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                        active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="font-medium">Rating</span>
                        <div className="flex items-center gap-1">
                          <ArrowDown className="w-3 h-3" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>
      )}

      {/* Scrollable Results Container */}
      <div ref={scrollableRef} className="flex-1 lg:overflow-y-auto lg:pr-2 space-y-4">
        {loading && (
          <div className={isMobile
            ? 'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center'
            : 'flex-1 flex flex-col items-center justify-center'
          }>
            <LottiePlayer animationPath="/animations/loading-animation.json" /> 
            <p className="text-slate-600 mt-4">Loading tee times...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}
        {!loading && !error && !hasSearched && !isMobile && (
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-[600px]">
            <div 
              className="fixed inset-0 w-screen h-screen bg-cover bg-center opacity-40 z-0"
              style={{
                backgroundImage: 'url(/golf-course.png)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed'
              }}
            />
            <div className="relative z-10 text-center">
              <h2 className="text-2xl font-semibold text-slate-700 mb-2">
                Click &quot;Get Tee Times&quot; to find your ideal tee time
              </h2>
              <p className="text-white">
                Select your preferences and discover available tee times
              </p>
            </div>
          </div>
        )}
        {!loading && !error && hasSearched && filteredTeeTimes(teeTimes).length === 0 && (
          <div className="text-center py-8 text-slate-600">No tee times available for the selected criteria.</div>
        )}
      
        {!loading && !error && (() => {
          const filtered = filteredTeeTimes(teeTimes);
          const grouped = groupTeeTimesByDate(filtered);
          
          // If only one date, show without accordion
          if (grouped.length === 1) {
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[0].teeTimes.map((teeTime, index) => (
                  <TeeTimeCard
                    key={index}
                    teeTime={teeTime}
                    index={index}
                  />
                ))}
              </div>
            );
          }
          
          // If multiple dates, show with accordion
          return (
            <Accordion type="multiple" defaultValue={grouped.map((_, index) => `date-${index}`)} className="w-full">
              {grouped.map((group, groupIndex) => (
                <AccordionItem key={groupIndex} value={`date-${groupIndex}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full mr-4">
                      <span className="font-semibold text-lg">
                        {formatDateDisplay(group.date)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {group.teeTimes.length} tee time{group.teeTimes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                      {group.teeTimes.map((teeTime, index) => (
                        <TeeTimeCard
                          key={index}
                          teeTime={teeTime}
                          index={index}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          );
        })()}
        
        {/* Subscription Component with Fade-in Animation */}
        {showSubscription && (
          <div className={`transition-all duration-1000 ease-in-out ${
            showSubscription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <SubscriptionSignup 
                isOpen={showSubscription} 
                onOpenChange={setShowSubscription}
                onDismiss={handleSubscriptionDismiss}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

TeeTimeCards.displayName = 'TeeTimeCards';

export default TeeTimeCards; 