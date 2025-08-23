"use client";
import { forwardRef, useRef, useImperativeHandle, useState, useEffect, useMemo, useCallback } from "react";
import { VirtuosoGrid, VirtuosoGridHandle } from 'react-virtuoso';
import { Listbox } from "@headlessui/react";
import { ChevronDown, ArrowUp, ArrowDown, HeartCrack } from "lucide-react";
import { type TeeTime } from "../services/teeTimeService";
// Timezone-aware helpers are implemented locally to allow passing region-specific timezones
import { SubscriptionSignup } from "@/components/SubscriptionSignup";
import LottiePlayer from "@/components/LottiePlayer";
import TeeTimeCard from "@/components/TeeTimeCard";
import ShareButton from "@/components/ShareButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface VirtualizedTeeTimeCardsProps {
  teeTimes: TeeTime[];
  loading: boolean;
  error: string | null;
  removedCourseIds: number[];
  onRemoveCourse: (courseId: number, courseName?: string) => void;
  fetchedDates: Date[] | undefined;
  sortBy: 'startTime' | 'priceAsc' | 'priceDesc' | 'rating';
  setSortBy: (sortBy: 'startTime' | 'priceAsc' | 'priceDesc' | 'rating') => void;
  showSubscription: boolean;
  setShowSubscription: (show: boolean) => void;
  handleSubscriptionDismiss: () => void;
  isMobile: boolean;
  hasSearched: boolean;
  courseCityMapping: Record<string, string>;
  onTeeTimeVisibilityChange?: (visibleCount: number) => void;
  selectedRegionId: string;
  // Optional IANA timezone for the selected region (e.g., 'America/Vancouver')
  regionTimeZone?: string;
  // If true, show skeletons instead of the animation when loading
  useSkeletonWhileLoading?: boolean;
  // If true, do not render the initial empty-state background image/prompt
  disableInitialEmptyState?: boolean;
  // Optional share URL for the Share button
  shareUrl?: string;
}

export interface VirtualizedTeeTimeCardsRef {
  scrollableElement: HTMLDivElement | null;
  sectionElement: HTMLElement | null;
}

const VirtualizedTeeTimeCards = forwardRef<VirtualizedTeeTimeCardsRef, VirtualizedTeeTimeCardsProps>(({
  teeTimes,
  loading,
  error,
  removedCourseIds,
  onRemoveCourse,
  fetchedDates,
  sortBy,
  setSortBy,
  showSubscription,
  setShowSubscription,
  handleSubscriptionDismiss,
  isMobile,
  hasSearched,
  onTeeTimeVisibilityChange,
  selectedRegionId,
  regionTimeZone,
  useSkeletonWhileLoading,
  disableInitialEmptyState,
  shareUrl
}, ref) => {
  
  const DEFAULT_TIMEZONE = 'America/Vancouver';
  const effectiveTimeZone = regionTimeZone || DEFAULT_TIMEZONE;

  const parseDateTimeInTimeZone = (dateTimeString: string, timeZone: string): Date => {
    const date = new Date(dateTimeString.replace('T', ' '));
    return new Date(date.toLocaleString('en-US', { timeZone }));
  };

  const getNowInTimeZone = (timeZone: string): Date => {
    return new Date(new Date().toLocaleString('en-US', { timeZone }));
  };

  const getTodayInTimeZone = (timeZone: string): Date => {
    const now = getNowInTimeZone(timeZone);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const sectionRef = useRef<HTMLElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const virtuosoRef = useRef<VirtuosoGridHandle>(null);
  const [visibleTeeTimes, setVisibleTeeTimes] = useState<Set<number>>(new Set());

  // Expose both refs to parent component
  useImperativeHandle(ref, () => ({
    scrollableElement: scrollableRef.current,
    sectionElement: sectionRef.current,
  }), []);

  // No need to calculate explicit container dimensions with VirtuosoGrid

  // Notify parent when visible count changes
  useEffect(() => {
    if (onTeeTimeVisibilityChange) {
      onTeeTimeVisibilityChange(visibleTeeTimes.size);
    }
  }, [visibleTeeTimes.size, onTeeTimeVisibilityChange]);

  const filteredTeeTimes = useMemo(() => {
    let filtered = teeTimes;

    // Filter out removed courses (frontend-only) by numeric id
    if (removedCourseIds.length > 0) {
      filtered = filtered.filter(teeTime => !removedCourseIds.includes(Number(teeTime.course_id)));
    }

    return filtered;
  }, [teeTimes, removedCourseIds]);

  // Sorting (separate from filtering for clarity)
  const sortedTeeTimes = useMemo(() => {
    const copy = [...filteredTeeTimes];
    copy.sort((a, b) => {
      switch (sortBy) {
        case 'startTime': {
          const timeA = parseDateTimeInTimeZone(a.start_datetime, effectiveTimeZone);
          const timeB = parseDateTimeInTimeZone(b.start_datetime, effectiveTimeZone);
          return timeA.getTime() - timeB.getTime();
        }
        case 'priceAsc':
          return Number(a.price) - Number(b.price);
        case 'priceDesc':
          return Number(b.price) - Number(a.price);
        case 'rating': {
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return ratingB - ratingA;
        }
        default:
          return 0;
      }
    });
    return copy;
  }, [filteredTeeTimes, sortBy, effectiveTimeZone]);

  // Group tee times by date
  const groupedTeeTimes = useMemo(() => {
    const grouped = sortedTeeTimes.reduce((acc, teeTime) => {
      const teeTimeDateTime = parseDateTimeInTimeZone(teeTime.start_datetime, effectiveTimeZone);
      const dateKey = teeTimeDateTime.toDateString();
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(teeTime);
      
      return acc;
    }, {} as Record<string, TeeTime[]>);

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedDates.map(dateKey => ({
      date: dateKey,
      teeTimes: grouped[dateKey]
    }));
  }, [sortedTeeTimes, effectiveTimeZone]);

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = getTodayInTimeZone(effectiveTimeZone);
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
        day: 'numeric'
      });
    }
  };

  // Flat data is only needed in single-date mode; VirtuosoGrid uses simple index-based rendering
  const singleDayItems = useMemo(() => {
    if (groupedTeeTimes.length === 1) {
      return groupedTeeTimes[0].teeTimes;
    }
    return [] as TeeTime[];
  }, [groupedTeeTimes]);

  // Build share text from fetched dates in format like "Aug 12"
  const shareText = useMemo(() => {
    if (fetchedDates && fetchedDates.length > 0) {
      const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
      const formattedUniqueDates = Array.from(new Set(fetchedDates.map((d) => formatter.format(d))));
      const datesStr = formattedUniqueDates.join(', ');
      return `Found some good tee times for ${datesStr}`;
    }
    return 'Found some good tee times';
  }, [fetchedDates]);

  const renderTeeTimeItem = useCallback((index: number, teeTime: TeeTime) => {
    return (
      <div className="p-2">
        <TeeTimeCard
          teeTime={teeTime}
          index={index}
          onRemoveCourse={onRemoveCourse}
          onVisibilityChange={(isVisible) => {
            setVisibleTeeTimes(prev => {
              const newSet = new Set(prev);
              if (isVisible) {
                newSet.add(index);
              } else {
                newSet.delete(index);
              }
              return newSet;
            });
          }}
        />
      </div>
    );
  }, [onRemoveCourse]);

  return (
    <section ref={sectionRef} className="flex-1 flex flex-col lg:h-full lg:overflow-hidden w-full max-w-full">
      {/* Sort row: white sort container + Share button as siblings */}
      {!loading && !error && filteredTeeTimes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-7 w-full max-w-full mb-4 px-2">
          {shareUrl && (
            <ShareButton url={shareUrl} buttonLabel="Share tee times" className="px-6 py-6 text-lg lg:text-base" text={shareText}/>
          )}
          <div className="bg-white rounded-lg shadow p-3 flex-shrink-0 w-full sm:w-auto">
            <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase flex-shrink-0">Sort By</span>
              <Listbox value={sortBy} onChange={setSortBy}>
                <div className="relative flex-shrink-0">
                  <Listbox.Button className="px-3 sm:px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors w-full sm:min-w-[180px] max-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 text-xs sm:text-sm truncate">
                        {sortBy === 'startTime' && 'Start Time'}
                        {sortBy === 'priceAsc' && 'Price (Low to High)'}
                        {sortBy === 'priceDesc' && 'Price (High to Low)'}
                        {sortBy === 'rating' && 'Rating'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {sortBy === 'startTime' && <ArrowUp className="w-3 h-3 text-slate-500" />}
                        {sortBy === 'priceAsc' && <ArrowUp className="w-3 h-3 text-slate-500" />}
                        {sortBy === 'priceDesc' && <ArrowDown className="w-3 h-3 text-slate-500" />}
                        {sortBy === 'rating' && <ArrowDown className="w-3 h-3 text-slate-500" />}
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-auto focus:outline-none max-h-60 w-full sm:min-w-[200px] max-w-[250px]">
                    <Listbox.Option
                      value="startTime"
                      className={({ active }) =>
                        `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                          active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="font-medium">Start Time</span>
                          <div className="flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </>
                      )}
                    </Listbox.Option>
                    <Listbox.Option
                      value="priceAsc"
                      className={({ active }) =>
                        `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                          active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="font-medium">Price (Low to High)</span>
                          <div className="flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </>
                      )}
                    </Listbox.Option>
                    <Listbox.Option
                      value="priceDesc"
                      className={({ active }) =>
                        `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                          active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="font-medium">Price (High to Low)</span>
                          <div className="flex items-center gap-1">
                            <ArrowDown className="w-3 h-3" />
                            {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </>
                      )}
                    </Listbox.Option>
                    <Listbox.Option
                      value="rating"
                      className={({ active }) =>
                        `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${
                          active ? 'bg-primary text-primary-foreground' : 'text-slate-700'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="font-medium">Rating</span>
                          <div className="flex items-center gap-1">
                            <ArrowDown className="w-3 h-3" />
                            {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </>
                      )}
                    </Listbox.Option>
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Results Container */}
      <div ref={scrollableRef} className="flex-1 w-full max-w-full overflow-auto h-full">
        {loading && !useSkeletonWhileLoading && (
          <div className={isMobile
            ? 'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center'
            : 'flex-1 flex flex-col items-center justify-center'
          }>
            <LottiePlayer animationPath="/animations/loading-animation.json" /> 
            <p className="text-slate-600 mt-4">Loading tee times...</p>
          </div>
        )}
        {loading && useSkeletonWhileLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded mb-3" />
                <div className="h-4 w-1/2 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-2/3 bg-slate-200 rounded mb-2" />
                <div className="h-48 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-red-500">{error}</div>
        )}
        {!loading && !error && !hasSearched && !isMobile && !disableInitialEmptyState && (
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-[600px]">
            <div 
              className="fixed inset-0 w-screen h-screen bg-cover bg-center opacity-60 z-0"
              style={{
                backgroundImage: 'url(/bg1.png)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed'
              }}
            />
            <div className="relative z-10 text-center">
              <h2 className="text-2xl font-semibold text-slate-700 mb-2">
                Click &quot;Get Tee Times&quot; to find your ideal tee time
              </h2>
              <p className="text-white font-semibold">
                Select your preferences and discover available tee times
              </p>
            </div>
          </div>
        )}
        {!loading && !error && hasSearched && filteredTeeTimes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600">
            <HeartCrack className="w-10 h-10 text-slate-400 mb-2" />
            <p className="font-medium">Unfortunately, no tee times found.</p>
          </div>
        )}
      
        {!loading && !error && filteredTeeTimes.length > 0 && (
          <div className="h-full w-full max-w-full overflow-hidden">
            {groupedTeeTimes.length === 1 ? (
              // Single date - show header with day and date, then virtual grid
              <div className="w-full max-w-full h-full flex flex-col">
                <div className="px-2 pb-2 flex-shrink-0">
                  <div className="flex items-baseline justify-between sm:gap-2">
                    <span className="font-semibold text-base sm:text-lg">{formatDateDisplay(groupedTeeTimes[0].date)}</span>
                    {fetchedDates && fetchedDates.length > 1 && (
                      <span className="text-[10px] sm:text-xs text-amber-700">(Only this day has tee times)</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-h-0 w-full">
                  <VirtuosoGrid
                    ref={virtuosoRef}
                    data={singleDayItems}
                    itemContent={(index, item) => renderTeeTimeItem(index, item)}
                    listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 w-full"
                    className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full max-w-full"
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
            ) : (
              // Multiple dates - use accordion with virtual scrolling for each group
              <Accordion type="multiple" defaultValue={groupedTeeTimes.map((_, index) => `date-${index}`)} className="w-full h-full max-w-full">
                {groupedTeeTimes.map((group, groupIndex) => {
                  const groupTeeTimes = group.teeTimes;
                  
                  return (
                    <AccordionItem key={groupIndex} value={`date-${groupIndex}`} className="border-b">
                      <AccordionTrigger className="text-left px-4 py-3">
                        <div className="flex items-center justify-between w-full mr-4">
                          <span className="font-semibold text-lg">
                            {formatDateDisplay(group.date)}
                          </span>
                          <span className="text-sm text-slate-500">
                            {groupTeeTimes.length} tee time{groupTeeTimes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="h-[400px] w-full max-w-full">
                          <VirtuosoGrid
                            data={groupTeeTimes}
                            itemContent={(index, item) => renderTeeTimeItem(index, item)}
                            listClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2 w-full"
                            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full max-w-full"
                            style={{ height: '100%' }}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        )}
        
        {/* Subscription Component with Fade-in Animation */}
        {showSubscription && (
          <div className={`transition-all duration-1000 ease-in-out w-full max-w-full ${
            showSubscription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 w-full max-w-full">
              <SubscriptionSignup 
                isOpen={showSubscription} 
                onOpenChange={setShowSubscription}
                onDismiss={handleSubscriptionDismiss}
                selectedRegionId={selectedRegionId}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

VirtualizedTeeTimeCards.displayName = 'VirtualizedTeeTimeCards';

export default VirtualizedTeeTimeCards; 