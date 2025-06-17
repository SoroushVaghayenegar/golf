"use client";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Listbox, Switch } from "@headlessui/react";
import { ChevronDownIcon, UserGroupIcon, ClockIcon, MapPinIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import { Range } from "react-range";
import { fetchTeeTimes, type TeeTime, cities, type City } from "../services/teeTimeService";
import { 
  getVancouverToday, 
  isPastDateInVancouver,
  getMinSelectableDateInVancouver, 
  isDateDisabledInVancouver, 
  formatDateForAPI, 
  parseDateTimeInVancouver,
  getVancouverNow,
  getCurrentVancouverTime
} from "../services/timezoneService";

export default function Home() {
  // State for filters
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getVancouverToday());
  const [fetchedDate, setFetchedDate] = useState<Date | undefined>(getVancouverToday());
  const [numOfPlayers, setNumOfPlayers] = useState<number>(4);
  const [holes, setHoles] = useState(18);
  const [timeRange, setTimeRange] = useState<number[]>([5, 22]); // 5am to 10pm
  const [citiesFilterEnabled, setCitiesFilterEnabled] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'startTime' | 'priceAsc' | 'priceDesc'>('startTime');
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  // Function to fetch tee times
  const handleGetTeeTimes = async () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Selected date:', selectedDate);
      
      const formattedDate = formatDateForAPI(selectedDate);
      console.log(formattedDate)
      const data = await fetchTeeTimes({
        date: formattedDate, // YYYY-MM-DD
        numOfPlayers,
        holes
      });
      setTeeTimes(data);
      setFetchedDate(selectedDate);
    } catch (err) {
      setError('Failed to fetch tee times. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    
    // If date is today, filter out tee times that are earlier than now
    if (fetchedDate) {
      const vancouverToday = getVancouverToday();
      const isToday = fetchedDate.toDateString() === vancouverToday.toDateString();
      
      if (isToday) {
        const vancouverNow = getVancouverNow();
        filtered = filtered.filter(teeTime => {
          const teeTimeDateTime = parseDateTimeInVancouver(teeTime.start_datetime);
          console.log(teeTimeDateTime, vancouverNow)
          return teeTimeDateTime >= vancouverNow;
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
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4 sm:p-10 flex font-[family-name:var(--font-geist-sans)]">
      <main className="w-full flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-5rem)]">
        {/* Settings Section - Fixed on left for desktop, top for mobile */}
        <section className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl shadow p-4 flex flex-col gap-3 lg:h-fit lg:sticky lg:top-4">
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm text-slate-500">
              Vancouver Time: {getCurrentVancouverTime()}
            </div>
            
            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                fromDate={getMinSelectableDateInVancouver()}
                disabled={isDateDisabledInVancouver}
                className="!p-0"
                modifiers={{
                  past: (date) => isPastDateInVancouver(date)
                }}
                modifiersStyles={{
                  past: { color: '#9ca3af', opacity: 0.5 }
                }}
              />
            </div>
          </div>

          {/* Players and Holes Row */}
          <div className="flex gap-6">
            {/* Players Selector */}
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <UserGroupIcon className="w-5 h-5" />
                <span className="font-semibold">Players</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumOfPlayers(num)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      numOfPlayers === num
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white hover:bg-blue-50 border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Holes Dropdown */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="font-semibold">Holes</span>
              <Listbox value={holes} onChange={setHoles}>
                <div className="relative">
                  <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span>{holes}</span>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none">
                    {[18, 9].map((option) => (
                      <Listbox.Option
                        key={option}
                        value={option}
                        className={({ active }) =>
                          `px-4 py-2 cursor-pointer ${
                            active ? 'bg-blue-50 text-blue-500' : 'text-slate-700'
                          }`
                        }
                      >
                        {option} Holes
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-5 h-5" />
              <span className="font-semibold">Time Range</span>
            </div>
            <div className="px-2">
              <Range
                step={1}
                min={5}
                max={22}
                values={timeRange}
                onChange={(values) => setTimeRange(values)}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="w-full h-2 bg-slate-200 rounded-full"
                    style={{
                      ...props.style,
                    }}
                  >
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${((timeRange[1] - timeRange[0]) / (22 - 5)) * 100}%`,
                        left: `${((timeRange[0] - 5) / (22 - 5)) * 100}%`,
                        position: 'relative'
                      }}
                    />
                    {children}
                  </div>
                )}
                renderThumb={({ props }) => {
                  const { key, ...otherProps } = props;
                  return (
                    <div
                      key={key}
                      {...otherProps}
                      className="w-6 h-6 bg-blue-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
                      style={{
                        ...otherProps.style,
                      }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  );
                }}
              />
              <div className="flex justify-between mt-2 text-sm text-slate-600">
                <span>{formatHour(timeRange[0])}</span>
                <span>{formatHour(timeRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Cities Filter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-5 h-5" />
                <span className="font-semibold">Filter by Cities</span>
              </div>
              <Switch
                checked={citiesFilterEnabled}
                onChange={setCitiesFilterEnabled}
                className={`${
                  citiesFilterEnabled ? 'bg-blue-500' : 'bg-slate-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    citiesFilterEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            {citiesFilterEnabled && (
              <div className="relative">
                <Listbox value={selectedCities} onChange={setSelectedCities} multiple>
                  <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span>
                      {selectedCities.length === 0
                        ? 'Select cities'
                        : `${selectedCities.length} cities selected`}
                    </span>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 w-full bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-auto focus:outline-none max-h-60">
                    {cities.map((city: City) => (
                      <Listbox.Option
                        key={city}
                        value={city}
                        className={({ active }) =>
                          `px-4 py-2 cursor-pointer ${
                            active ? 'bg-blue-50 text-blue-500' : 'text-slate-700'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 border rounded ${
                              selected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'
                            } flex items-center justify-center`}>
                              {selected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {city}
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Listbox>
              </div>
            )}
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Sort By</span>
            <Listbox value={sortBy} onChange={setSortBy}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <div className="flex items-center justify-between">
                    <span>
                      {sortBy === 'startTime' && 'Start Time'}
                      {sortBy === 'priceAsc' && 'Price (Low to High)'}
                      {sortBy === 'priceDesc' && 'Price (High to Low)'}
                    </span>
                    <div className="flex items-center gap-1">
                      {sortBy === 'startTime' && <ArrowUpIcon className="w-4 h-4" />}
                      {sortBy === 'priceAsc' && <ArrowUpIcon className="w-4 h-4" />}
                      {sortBy === 'priceDesc' && <ArrowDownIcon className="w-4 h-4" />}
                      <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 w-full bottom-full mb-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-auto focus:outline-none max-h-60">
                  <Listbox.Option
                    value="startTime"
                    className={({ active }) =>
                      `px-4 py-2 cursor-pointer flex items-center justify-between ${
                        active ? 'bg-blue-50 text-blue-500' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span>Start Time</span>
                        <div className="flex items-center gap-1">
                          <ArrowUpIcon className="w-4 h-4" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                  <Listbox.Option
                    value="priceAsc"
                    className={({ active }) =>
                      `px-4 py-2 cursor-pointer flex items-center justify-between ${
                        active ? 'bg-blue-50 text-blue-500' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span>Price (Low to High)</span>
                        <div className="flex items-center gap-1">
                          <ArrowUpIcon className="w-4 h-4" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                  <Listbox.Option
                    value="priceDesc"
                    className={({ active }) =>
                      `px-4 py-2 cursor-pointer flex items-center justify-between ${
                        active ? 'bg-blue-50 text-blue-500' : 'text-slate-700'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span>Price (High to Low)</span>
                        <div className="flex items-center gap-1">
                          <ArrowDownIcon className="w-4 h-4" />
                          {selected && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          {/* Get Tee Times Button */}
          <button
            onClick={handleGetTeeTimes}
            disabled={loading || !selectedDate}
            className={`mt-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              loading || !selectedDate
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Searching...' : 'Get Tee Times'}
          </button>
        </section>

        {/* Tee Times Results Section - Scrollable */}
        <section className="flex-1 flex flex-col gap-4 lg:overflow-y-auto">
          {loading && (
            <div className="text-center py-8 text-slate-600">Loading tee times...</div>
          )}
          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}
          {!loading && !error && filteredTeeTimes(teeTimes).length === 0 && (
            <div className="text-center py-8 text-slate-600">No tee times available for the selected criteria.</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {!loading && !error && filteredTeeTimes(teeTimes).map((teeTime, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{teeTime.course_name}</h3>
                    <p className="text-sm text-slate-500">{teeTime.city}</p>
                  </div>
                  <div className="flex flex-col gap-1 text-slate-600">
                    <p className="text-lg font-medium">
                      {parseDateTimeInVancouver(teeTime.start_datetime).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'America/Vancouver'
                      })}
                    </p>
                    <p>{teeTime.holes} holes</p>
                    <p>{teeTime.players_available} spots available</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      ${Number(teeTime.price).toFixed(2)}
                    </p>
                  </div>
                  {teeTime.booking_link && (
                    <div className="mt-2">
                      <a
                        href={teeTime.booking_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-center block"
                      >
                        Book
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
