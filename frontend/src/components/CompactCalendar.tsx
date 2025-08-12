"use client";

import posthog from 'posthog-js';
import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import {
  isPastDateInVancouver,
  getMinSelectableDateInVancouver, 
  isDateDisabledInVancouver
} from "../services/timezoneService";

interface CompactCalendarProps {
  selectedDates: Date[] | undefined;
  setSelectedDates: (dates: Date[] | undefined) => void;
  isClient: boolean;
  todayDate: Date | null;
  className?: string;
  expandedContainerClassName?: string;
  closeOnSelect?: boolean;
  selectionMode?: 'single' | 'multiple';
}

export default function CompactCalendar({
  selectedDates,
  setSelectedDates,
  isClient,
  todayDate,
  className = "",
  expandedContainerClassName,
  closeOnSelect = false,
  selectionMode = 'multiple'
}: CompactCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Close calendar on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isExpanded]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    const next = dates && dates.length > 0 ? [...dates] : undefined;
    setSelectedDates(next);
    posthog.capture('calendar_date_selected', {
      selected_dates_count: next?.length || 0,
      selected_dates: next?.map(d => d.toISOString().split('T')[0])
    });
    if (closeOnSelect && next && next.length > 0) {
      setIsExpanded(false);
    }
  };

  const removeDateFromSelection = (dateToRemove: Date) => {
    if (selectedDates) {
      const newDates = selectedDates.filter(date => 
        date.toDateString() !== dateToRemove.toDateString()
      );
      setSelectedDates(newDates.length > 0 ? newDates : undefined);
      posthog.capture('calendar_date_removed', {
        removed_date: dateToRemove.toISOString().split('T')[0],
        remaining_dates_count: newDates.length
      });
    }
  };

  const sortedDates = selectedDates ? [...selectedDates].sort((a, b) => a.getTime() - b.getTime()) : [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Compact View */}
      <div
        onClick={() => setIsExpanded(true)}
        className={`
          min-h-[3rem] p-3 border border-slate-200 rounded-lg bg-white cursor-pointer 
          transition-all duration-200 hover:border-primary hover:shadow-sm
          focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20
          ${isExpanded ? 'border-primary shadow-md' : ''}
        `}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}
        role="button"
        aria-label="Open calendar to select dates"
      >
        <div className="flex items-center gap-2 min-h-[1.5rem]">
          <CalendarIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
          
          {!selectedDates || selectedDates.length === 0 ? (
            <span className="text-slate-500 text-sm">Select date...</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {selectionMode === 'multiple' ? (
                <>
                  {/* Desktop: show all selected dates */}
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    {sortedDates.map((d) => (
                      <div key={d.toISOString()} className="inline-flex items-center gap-1 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground rounded-md text-xs font-medium">
                        <span>{formatDate(d)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDateFromSelection(d);
                          }}
                          className="hover:bg-sidebar-primary/80 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${formatDate(d)}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Mobile: show all selected dates (short labels) */}
                  <div className="flex sm:hidden flex-wrap gap-1">
                    {sortedDates.map((d) => (
                      <div key={d.toISOString()} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sidebar-primary text-sidebar-primary-foreground rounded text-xs font-medium">
                        <span>{formatDateShort(d)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDateFromSelection(d);
                          }}
                          className="hover:bg-sidebar-primary/80 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${formatDate(d)}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Single selection mode - show one date */}
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground rounded-md text-xs font-medium">
                      <span>{formatDate(sortedDates[0])}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDateFromSelection(sortedDates[0]);
                        }}
                        className="hover:bg-sidebar-primary/80 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${formatDate(sortedDates[0])}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex sm:hidden flex-wrap gap-1">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sidebar-primary text-sidebar-primary-foreground rounded text-xs font-medium">
                      <span>{formatDateShort(sortedDates[0])}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDateFromSelection(sortedDates[0]);
                        }}
                        className="hover:bg-sidebar-primary/80 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${formatDate(sortedDates[0])}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Calendar */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2">
          <div 
            ref={calendarRef}
            className={`bg-white border border-slate-200 rounded-lg shadow-xl ${expandedContainerClassName ?? 'p-3 max-w-sm mx-auto'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Select Dates</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Close calendar"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            {isClient ? (
              <Calendar
                mode={selectionMode}
                selected={selectionMode === 'single' ? selectedDates?.[0] : selectedDates}
                onSelect={(value: any) => {
                  if (selectionMode === 'single') {
                    const date: Date | undefined = value as Date | undefined;
                    handleDateSelect(date ? [date] : undefined);
                  } else {
                    const dates: Date[] | undefined = value as Date[] | undefined;
                    handleDateSelect(dates);
                  }
                }}
                fromDate={getMinSelectableDateInVancouver()}
                disabled={isDateDisabledInVancouver}
                className="w-full"
                classNames={{
                  root: "!w-full",
                  table: "w-full border-collapse",
                  day: "relative w-full h-full p-0 text-center group/day aspect-square select-none [&_button[data-selected-single=true]]:bg-sidebar-primary [&_button[data-selected-single=true]]:text-sidebar-primary-foreground [&_button:hover]:bg-sidebar-primary/10 [&_button:hover]:text-sidebar-primary",
                  today: "bg-green-100 text-green-800 rounded-md [&_button]:bg-green-100 [&_button]:text-green-800 [&_button[data-selected-single=true]]:!bg-sidebar-primary [&_button[data-selected-single=true]]:!text-sidebar-primary-foreground"
                }}
                modifiers={{
                  past: (date: Date) => isPastDateInVancouver(date),
                  today: (date: Date) => todayDate ? (date.toDateString() === todayDate.toDateString()) : false
                }}
                modifiersStyles={{
                  past: { color: '#9ca3af', opacity: 0.5 }
                }}
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-slate-500">
                Loading calendar...
              </div>
            )}

            {/* Selected dates summary */}
            {selectedDates && selectedDates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-600 mb-2">
                  {selectedDates.length > 1 ? 'Selected Dates' : 'Selected Date'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sortedDates.map((d) => (
                    <div key={d.toISOString()} className="inline-flex items-center gap-1 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground rounded text-xs">
                      <span>{formatDate(d)}</span>
                      <button
                        onClick={() => removeDateFromSelection(d)}
                        className="hover:bg-sidebar-primary/80 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${formatDate(d)}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      )}
    </div>
  );
}
