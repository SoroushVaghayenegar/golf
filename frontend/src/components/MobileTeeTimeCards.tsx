"use client";

import { forwardRef, useRef, useImperativeHandle, useState, useEffect, useMemo, useCallback } from "react";
import { Listbox } from "@headlessui/react";
import { Virtuoso } from 'react-virtuoso';
import { ChevronDown, ArrowUp, ArrowDown, HeartCrack } from "lucide-react";
import { type TeeTime } from "../services/teeTimeService";
import { SubscriptionSignup } from "@/components/SubscriptionSignup";
import LottiePlayer from "@/components/LottiePlayer";
import TeeTimeCard from "@/components/TeeTimeCard";
import ShareButton from "@/components/ShareButton";
import type { VirtualizedTeeTimeCardsRef } from "@/components/VirtualizedTeeTimeCards";

interface MobileTeeTimeCardsProps {
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
  regionTimeZone?: string;
  useSkeletonWhileLoading?: boolean;
  disableInitialEmptyState?: boolean;
  shareUrl?: string;
}

type FlatItem =
  | { type: 'header'; date: string }
  | { type: 'card'; teeTime: TeeTime; cardIndex: number; date: string };

const MobileTeeTimeCards = forwardRef<VirtualizedTeeTimeCardsRef, MobileTeeTimeCardsProps>(({ 
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
  const [visibleCountFromRange, setVisibleCountFromRange] = useState<number>(0);

  useImperativeHandle(ref, () => ({
    scrollableElement: null,
    sectionElement: sectionRef.current,
  }), []);

  // No internal scroll container on mobile – allow page to scroll

  // Notify parent when visible count changes (prefer range-based to avoid IO edge cases with virtualization)
  useEffect(() => {
    if (onTeeTimeVisibilityChange) {
      onTeeTimeVisibilityChange(visibleCountFromRange);
    }
  }, [visibleCountFromRange, onTeeTimeVisibilityChange]);

  const filteredTeeTimes = useMemo(() => {
    let filtered = teeTimes;

    if (removedCourseIds.length > 0) {
      filtered = filtered.filter(teeTime => !removedCourseIds.includes(Number(teeTime.course_id)));
    }

    return filtered;
  }, [teeTimes, removedCourseIds]);

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

  const groupedTeeTimes = useMemo(() => {
    const grouped = sortedTeeTimes.reduce((acc, teeTime) => {
      const teeTimeDateTime = parseDateTimeInTimeZone(teeTime.start_datetime, effectiveTimeZone);
      const dateKey = teeTimeDateTime.toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(teeTime);
      return acc;
    }, {} as Record<string, TeeTime[]>);

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return sortedDates.map(dateKey => ({ date: dateKey, teeTimes: grouped[dateKey] }));
  }, [sortedTeeTimes, effectiveTimeZone]);

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = getTodayInTimeZone(effectiveTimeZone);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  // Build a flat list with headers and cards for optimal mobile scrolling
  const flatItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = [];
    let cardIndexCounter = 0;
    groupedTeeTimes.forEach(group => {
      items.push({ type: 'header', date: group.date });
      group.teeTimes.forEach(tt => {
        items.push({ type: 'card', teeTime: tt, cardIndex: cardIndexCounter, date: group.date });
        cardIndexCounter++;
      });
    });
    return items;
  }, [groupedTeeTimes]);

  // Virtual row sizes not needed since we render in normal flow for mobile

  const shareText = useMemo(() => {
    if (fetchedDates && fetchedDates.length > 0) {
      const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
      const formattedUniqueDates = Array.from(new Set(fetchedDates.map((d) => formatter.format(d))));
      const datesStr = formattedUniqueDates.join(', ');
      return `Found some good tee times for ${datesStr}`;
    }
    return 'Found some good tee times';
  }, [fetchedDates]);

  const renderItem = useCallback((item: FlatItem, key: number) => {
    if (item.type === 'header') {
      return (
        <div key={`header-${key}`} className="px-2 pb-1 py-4 bg-transparent">
          <div className="font-semibold text-base sm:text-lg">{formatDateDisplay(item.date)}</div>
        </div>
      );
    }
    return (
      <div key={`card-${key}`} className="p-2">
        <TeeTimeCard
          teeTime={item.teeTime}
          index={item.cardIndex}
          onRemoveCourse={onRemoveCourse}
        />
      </div>
    );
  }, [onRemoveCourse, formatDateDisplay]);

  return (
    <section ref={sectionRef} className="flex-1 flex flex-col lg:h-full lg:overflow-hidden w-full max-w-full">
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
                    <Listbox.Option value="startTime" className={({ active }) => `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${active ? 'bg-primary text-primary-foreground' : 'text-slate-700'}`}>
                      {({ selected }) => (<><span className="font-medium">Start Time</span><div className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{selected && <div className="w-2 h-2 bg-white rounded-full" />}</div></>)}
                    </Listbox.Option>
                    <Listbox.Option value="priceAsc" className={({ active }) => `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${active ? 'bg-primary text-primary-foreground' : 'text-slate-700'}`}>
                      {({ selected }) => (<><span className="font-medium">Price (Low to High)</span><div className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{selected && <div className="w-2 h-2 bg-white rounded-full" />}</div></>)}
                    </Listbox.Option>
                    <Listbox.Option value="priceDesc" className={({ active }) => `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${active ? 'bg-primary text-primary-foreground' : 'text-slate-700'}`}>
                      {({ selected }) => (<><span className="font-medium">Price (High to Low)</span><div className="flex items-center gap-1"><ArrowDown className="w-3 h-3" />{selected && <div className="w-2 h-2 bg-white rounded-full" />}</div></>)}
                    </Listbox.Option>
                    <Listbox.Option value="rating" className={({ active }) => `px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm ${active ? 'bg-primary text-primary-foreground' : 'text-slate-700'}`}>
                      {({ selected }) => (<><span className="font-medium">Rating</span><div className="flex items-center gap-1"><ArrowDown className="w-3 h-3" />{selected && <div className="w-2 h-2 bg-white rounded-full" />}</div></>)}
                    </Listbox.Option>
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-full">
        {loading && !useSkeletonWhileLoading && (
          <div className={isMobile ? 'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center' : 'flex-1 flex flex-col items-center justify-center'}>
            <LottiePlayer animationPath="/animations/loading-animation.json" />
            <p className="text-slate-600 mt-4">Loading tee times...</p>
          </div>
        )}
        {loading && useSkeletonWhileLoading && (
          <div className="grid grid-cols-1 gap-4 p-4">
            {Array.from({ length: 8 }).map((_, idx) => (
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
        {!loading && !error && !hasSearched && !disableInitialEmptyState && (
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-[500px]">
            <div className="fixed inset-0 w-screen h-screen bg-cover bg-center opacity-60 z-0" style={{ backgroundImage: 'url(/bg1.png)', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundAttachment: 'fixed' }} />
            <div className="relative z-10 text-center">
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Tap &quot;Get Tee Times&quot; to start</h2>
              <p className="text-white font-semibold">Select your preferences and discover tee times</p>
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
          <div className="w-full max-w-full">
            <Virtuoso
              useWindowScroll
              totalCount={flatItems.length}
              itemContent={(index) => renderItem(flatItems[index], index)}
              increaseViewportBy={{ top: 400, bottom: 800 }}
              rangeChanged={({ startIndex, endIndex }) => {
                // Count only cards in the current render range
                let count = 0;
                for (let i = startIndex; i <= endIndex; i++) {
                  const it = flatItems[i];
                  if (it && it.type === 'card') count++;
                }
                setVisibleCountFromRange(count);
              }}
            />
          </div>
        )}

        {showSubscription && (
          <div className={`transition-all duration-1000 ease-in-out w-full max-w-full ${showSubscription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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

MobileTeeTimeCards.displayName = 'MobileTeeTimeCards';

export default MobileTeeTimeCards;


