"use client";

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
}

export default function CompactCalendar({
  selectedDates,
  setSelectedDates,
  isClient,
  todayDate,
  className = ""
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
    setSelectedDates(dates);
    // Keep calendar open for multiple date selection
  };

  const removeDateFromSelection = (dateToRemove: Date) => {
    if (selectedDates) {
      const newDates = selectedDates.filter(date => 
        date.toDateString() !== dateToRemove.toDateString()
      );
      setSelectedDates(newDates.length > 0 ? newDates : undefined);
    }
  };

  const sortedDates = selectedDates?.sort((a, b) => a.getTime() - b.getTime()) || [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Compact View */}
      <div
        onClick={() => setIsExpanded(true)}
        className={`
          min-h-[3rem] p-3 border border-slate-200 rounded-lg bg-white cursor-pointer 
          transition-all duration-200 hover:border-blue-300 hover:shadow-sm
          focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20
          ${isExpanded ? 'border-blue-500 shadow-md' : ''}
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
            <span className="text-slate-500 text-sm">Select dates...</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 flex-1">
              {/* Show first few dates with full formatting on larger screens */}
              <div className="hidden sm:flex flex-wrap gap-1.5">
                {sortedDates.slice(0, 3).map((date, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                  >
                    <span>{formatDate(date)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDateFromSelection(date);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${formatDate(date)}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {sortedDates.length > 3 && (
                  <div className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                    +{sortedDates.length - 3} more
                  </div>
                )}
              </div>

              {/* Compact view for mobile */}
              <div className="flex sm:hidden flex-wrap gap-1">
                {sortedDates.slice(0, 4).map((date, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                  >
                    <span>{formatDateShort(date)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDateFromSelection(date);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${formatDate(date)}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {sortedDates.length > 4 && (
                  <div className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                    +{sortedDates.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Calendar */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2">
          <div 
            ref={calendarRef}
            className="bg-white border border-slate-200 rounded-lg shadow-xl p-4 max-w-fit mx-auto lg:max-w-none"
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
                mode="multiple"
                selected={selectedDates}
                onSelect={handleDateSelect}
                fromDate={getMinSelectableDateInVancouver()}
                disabled={isDateDisabledInVancouver}
                className="w-full"
                classNames={{
                  root: "!w-full",
                  table: "w-full border-collapse",
                  day: "relative w-full h-full p-0 text-center group/day aspect-square select-none [&_button[data-selected-single=true]]:bg-blue-500 [&_button[data-selected-single=true]]:text-white [&_button:hover]:bg-blue-50 [&_button:hover]:text-blue-900",
                  today: "bg-green-100 text-green-800 rounded-md [&_button]:bg-green-100 [&_button]:text-green-800 [&_button[data-selected-single=true]]:!bg-blue-500 [&_button[data-selected-single=true]]:!text-white"
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
                  Selected Dates ({selectedDates.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {sortedDates.map((date, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {formatDate(date)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}