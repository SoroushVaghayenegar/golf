"use client";
import { forwardRef, useRef, useImperativeHandle, useState, useEffect, useMemo, useCallback } from "react";
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
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

interface VirtualizedTeeTimeCardsProps {
  teeTimes: TeeTime[];
  loading: boolean;
  error: string | null;
  timeRange: number[];
  citiesFilterEnabled: boolean;
  selectedCities: string[];
  coursesFilterEnabled: boolean;
  selectedCourses: string[];
  removedCourses: string[];
  onRemoveCourse: (courseName: string) => void;
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
  selectedRegion: string;
}

export interface VirtualizedTeeTimeCardsRef {
  scrollableElement: HTMLDivElement | null;
  sectionElement: HTMLElement | null;
}

const VirtualizedTeeTimeCards = forwardRef<VirtualizedTeeTimeCardsRef, VirtualizedTeeTimeCardsProps>(({
  teeTimes,
  loading,
  error,
  timeRange,
  citiesFilterEnabled,
  selectedCities,
  coursesFilterEnabled,
  selectedCourses,
  removedCourses,
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
  selectedRegion
}, ref) => {
  
  const sectionRef = useRef<HTMLElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);
  const [visibleTeeTimes, setVisibleTeeTimes] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Expose both refs to parent component
  useImperativeHandle(ref, () => ({
    scrollableElement: scrollableRef.current,
    sectionElement: sectionRef.current,
  }), []);

  // Calculate container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (scrollableRef.current) {
        const rect = scrollableRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);
      }
    };

    // Use ResizeObserver for better performance and accuracy
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    // Initial update
    updateDimensions();
    
    // Observe the scrollable container
    if (scrollableRef.current) {
      resizeObserver.observe(scrollableRef.current);
    }
    
    // Fallback for window resize
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Notify parent when visible count changes
  useEffect(() => {
    if (onTeeTimeVisibilityChange) {
      onTeeTimeVisibilityChange(visibleTeeTimes.size);
    }
  }, [visibleTeeTimes.size, onTeeTimeVisibilityChange]);

  const filteredTeeTimes = useMemo(() => {
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
    
    // Filter out removed courses
    if (removedCourses.length > 0) {
      filtered = filtered.filter(teeTime => !removedCourses.includes(teeTime.course_name));
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
          
          if (teeTimeDate.toDateString() === vancouverToday.toDateString()) {
            return teeTimeDateTime >= vancouverNow;
          }
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
  }, [teeTimes, timeRange, citiesFilterEnabled, selectedCities, coursesFilterEnabled, selectedCourses, removedCourses, fetchedDates, sortBy]);

  // Group tee times by date
  const groupedTeeTimes = useMemo(() => {
    const grouped = filteredTeeTimes.reduce((acc, teeTime) => {
      const teeTimeDateTime = parseDateTimeInVancouver(teeTime.start_datetime);
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
  }, [filteredTeeTimes]);

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

  // Calculate grid dimensions
  const getGridDimensions = useCallback(() => {
    // Ensure we have a valid container width, with minimum constraints
    const availableWidth = Math.max(containerWidth || 320, 320); // Minimum 320px width
    
    let columns = 1;
    if (availableWidth >= 640) columns = 2; // sm
    if (availableWidth >= 1024) columns = 3; // lg
    
    // Ensure column width respects container boundaries
    const columnWidth = Math.floor(availableWidth / columns);
    const rowHeight = 400; // Approximate height of a TeeTimeCard
    
    return { columns, columnWidth, rowHeight };
  }, [containerWidth]);

  const { columns, columnWidth, rowHeight } = getGridDimensions();

  // Create a flat array of all tee times for virtual scrolling
  const flatTeeTimes = useMemo(() => {
    const flat: Array<{ teeTime: TeeTime; groupIndex: number; dateKey: string }> = [];
    
    groupedTeeTimes.forEach((group, groupIndex) => {
      group.teeTimes.forEach(teeTime => {
        flat.push({
          teeTime,
          groupIndex,
          dateKey: group.date
        });
      });
    });
    
    return flat;
  }, [groupedTeeTimes]);

  // Calculate total rows needed
  const totalRows = Math.ceil(flatTeeTimes.length / columns);

  // Cell renderer for virtual grid
  const cellRenderer = useCallback(({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const index = rowIndex * columns + columnIndex;
    const item = flatTeeTimes[index];
    
    if (!item) return null;

    return (
      <div style={style} className="p-2">
        <TeeTimeCard
          teeTime={item.teeTime}
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
  }, [flatTeeTimes, columns, onRemoveCourse]);

  return (
    <section ref={sectionRef} className="flex-1 flex flex-col lg:h-full lg:overflow-hidden w-full max-w-full">
      {/* Sort By Component - Only show when there are results */}
      {!loading && !error && filteredTeeTimes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex-shrink-0 w-full max-w-full">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase flex-shrink-0">Sort By</span>
            <Listbox value={sortBy} onChange={setSortBy}>
              <div className="relative flex-shrink-0">
                <Listbox.Button className="px-3 sm:px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-200 transition-colors w-full sm:min-w-[180px] max-w-[200px]">
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
      <div ref={scrollableRef} className="flex-1 lg:overflow-hidden w-full max-w-full">
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
        {!loading && !error && hasSearched && filteredTeeTimes.length === 0 && (
          <div className="text-center py-8 text-slate-600">No tee times available for the selected criteria.</div>
        )}
      
        {!loading && !error && filteredTeeTimes.length > 0 && (
          <div className="h-full w-full max-w-full overflow-hidden">
            {groupedTeeTimes.length === 1 ? (
              // Single date - use virtual grid
              <Grid
                columnCount={columns}
                columnWidth={columnWidth}
                height={containerHeight || 600}
                rowCount={totalRows}
                rowHeight={rowHeight}
                width={containerWidth || 320} // Use calculated container width with fallback
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full max-w-full"
              >
                {cellRenderer}
              </Grid>
            ) : (
              // Multiple dates - use accordion with virtual scrolling for each group
              <Accordion type="multiple" defaultValue={groupedTeeTimes.map((_, index) => `date-${index}`)} className="w-full h-full max-w-full">
                {groupedTeeTimes.map((group, groupIndex) => {
                  const groupTeeTimes = group.teeTimes;
                  const groupTotalRows = Math.ceil(groupTeeTimes.length / columns);
                  
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
                        <div className="h-[400px] w-full max-w-full overflow-hidden">
                          <Grid
                            columnCount={columns}
                            columnWidth={columnWidth}
                            height={400}
                            rowCount={groupTotalRows}
                            rowHeight={rowHeight}
                            width={containerWidth || 320} // Use calculated container width with fallback
                            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full max-w-full"
                          >
                            {({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
                              const index = rowIndex * columns + columnIndex;
                              const teeTime = groupTeeTimes[index];
                              
                              if (!teeTime) return null;

                              return (
                                <div style={{...style, maxWidth: '100%'}} className="p-2 w-full max-w-full overflow-hidden">
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
                            }}
                          </Grid>
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
                selectedRegion={selectedRegion}
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