"use client";

import posthog from 'posthog-js';
import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, X } from "lucide-react";
import {
  isPastDate,
  getMinSelectableDate, 
  isDateDisabled
} from "../services/timezoneService";

interface CompactCalendarProps {
  selectedDates: Date[] | undefined;
  setSelectedDates: (dates: Date[] | undefined) => void;
  isClient: boolean;
  todayDate: Date | null;
  className?: string;
  expandedContainerClassName?: string;
  closeOnSelect?: boolean;
  selectionMode?: 'single' | 'multiple' | 'both';
}

export default function CompactCalendar({
  selectedDates,
  setSelectedDates,
  isClient,
  todayDate,
  className = "",
  expandedContainerClassName,
  closeOnSelect = false,
  selectionMode = 'both'
}: CompactCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Determine effective selection mode based on prop
  const effectiveSelectionMode = selectionMode;

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

  const renderCalendar = () => {
    if (!isClient) {
      return (
        <div className="w-full h-64 flex items-center justify-center text-slate-500">
          Loading calendar...
        </div>
      );
    }

    if (effectiveSelectionMode === 'single') {
      return (
        <Calendar
          mode="single"
          selected={selectedDates?.[0]}
          onSelect={(date?: Date) => {
            handleDateSelect(date ? [date] : undefined);
          }}
          fromDate={getMinSelectableDate()}
          disabled={isDateDisabled}
          className="w-full [--cell-size:1.75rem] sm:[--cell-size:2rem]"
          classNames={{
            root: "!w-full",
            table: "w-full border-collapse",
            day: "relative w-full h-full p-0 text-center group/day aspect-square select-none [&_button[data-selected-single=true]]:bg-sidebar-primary [&_button[data-selected-single=true]]:text-sidebar-primary-foreground [&_button:hover]:bg-sidebar-primary/10 [&_button:hover]:text-sidebar-primary",
            today: "bg-green-100 text-green-800 rounded-md [&_button]:bg-green-100 [&_button]:text-green-800 [&_button[data-selected-single=true]]:!bg-sidebar-primary [&_button[data-selected-single=true]]:!text-sidebar-primary-foreground"
          }}
          modifiers={{
            past: (date: Date) => isPastDate(date),
            today: (date: Date) => todayDate ? (date.toDateString() === todayDate.toDateString()) : false
          }}
          modifiersStyles={{
            past: { color: '#9ca3af', opacity: 0.5 }
          }}
        />
      );
    }

    return (
      <Calendar
        mode="multiple"
        required={false}
        selected={selectedDates}
        onSelect={(dates?: Date[]) => {
          handleDateSelect(dates);
        }}
        fromDate={getMinSelectableDate()}
        disabled={isDateDisabled}
        className="w-full [--cell-size:1.75rem] sm:[--cell-size:2rem]"
        classNames={{
          root: "!w-full",
          table: "w-full border-collapse",
          day: "relative w-full h-full p-0 text-center group/day aspect-square select-none [&_button[data-selected-single=true]]:bg-sidebar-primary [&_button[data-selected-single=true]]:text-sidebar-primary-foreground [&_button:hover]:bg-sidebar-primary/10 [&_button:hover]:text-sidebar-primary",
          today: "bg-green-100 text-green-800 rounded-md [&_button]:bg-green-100 [&_button]:text-green-800 [&_button[data-selected-single=true]]:!bg-sidebar-primary [&_button[data-selected-single=true]]:!text-sidebar-primary-foreground"
        }}
        modifiers={{
          past: (date: Date) => isPastDate(date),
          today: (date: Date) => todayDate ? (date.toDateString() === todayDate.toDateString()) : false
        }}
        modifiersStyles={{
          past: { color: '#9ca3af', opacity: 0.5 }
        }}
      />
    );
  };

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
              {effectiveSelectionMode === 'multiple' ? (
                <>
                  {/* Desktop: show all selected dates */}
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    {sortedDates.map((d) => (
                      <div key={d.toISOString()} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sidebar-primary text-sidebar-primary-foreground rounded text-xs font-medium">
                        <span>{formatDate(d)}</span>
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
                  {/* Mobile: hide selected dates when calendar is open */}
                  {!isExpanded && (
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
                  )}
                </>
              ) : (
                <>
                  {/* Single selection mode - show one date */}
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sidebar-primary text-sidebar-primary-foreground rounded text-xs font-medium">
                      <span>{formatDate(sortedDates[0])}</span>
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
                  {!isExpanded && (
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
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Calendar */}
      {isExpanded && (
        <>
          {/* Mobile: Full-screen overlay */}
          <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 -ml-2 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Close calendar"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <h3 className="text-sm font-semibold text-slate-800">Select Dates</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-1.5 rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium"
                aria-label="Done selecting dates"
              >
                Done
              </button>
            </div>
            {selectionMode === 'both' && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
                <Switch
                  checked={isMultiDay}
                  onCheckedChange={(checked) => {
                    setIsMultiDay(checked);
                    // Clear selections when switching modes
                    if (!checked && selectedDates && selectedDates.length > 1) {
                      setSelectedDates([selectedDates[0]]);
                    }
                    posthog.capture('calendar_mode_switched', {
                      mode: checked ? 'multi-day' : 'single'
                    });
                  }}
                  id="mobile-selection-mode"
                />
                <label 
                  htmlFor="mobile-selection-mode" 
                  className="text-md font-small text-slate-700 cursor-pointer"
                >
                  {isMultiDay ? 'Multiple days' : 'Single day'}
                </label>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-3">
              {renderCalendar()}
            </div>
          </div>

          {/* Desktop: anchored popover */}
          <div className="hidden sm:block absolute top-full left-0 right-0 z-50 mt-2">
            <div
              ref={calendarRef}
              className={`bg-white border border-slate-200 rounded-lg shadow-xl ${expandedContainerClassName ?? 'p-3 max-w-sm mx-auto'}`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Select Dates</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Close calendar"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              {selectionMode === 'both' && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                  <Switch
                    checked={isMultiDay}
                    onCheckedChange={(checked) => {
                      setIsMultiDay(checked);
                      // Clear selections when switching modes
                      if (!checked && selectedDates && selectedDates.length > 1) {
                        setSelectedDates([selectedDates[0]]);
                      }
                      posthog.capture('calendar_mode_switched', {
                        mode: checked ? 'multi-day' : 'single'
                      });
                    }}
                    id="desktop-selection-mode"
                  />
                  <label 
                    htmlFor="desktop-selection-mode" 
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    {isMultiDay ? 'Multiple days' : 'Single day'}
                  </label>
                </div>
              )}
              <div className={selectionMode !== 'both' ? 'mt-4' : ''}>
                {renderCalendar()}
              </div>
              {selectedDates && selectedDates.length > 0 && (
                <div className="hidden lg:block mt-4 pt-4 border-t border-slate-200">
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
        </>
      )}
    </div>
  );
}
