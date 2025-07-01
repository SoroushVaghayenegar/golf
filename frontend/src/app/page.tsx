"use client";
import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Users, Clock, School, LandPlot } from "lucide-react";
import { Range } from "react-range";
import Select, { MultiValue, StylesConfig } from 'react-select';
import { fetchTeeTimes, type TeeTime } from "../services/teeTimeService";
import { fetchCourseDisplayNamesAndTheirCities } from "../services/supabaseService";
import { 
  getVancouverToday, 
  isPastDateInVancouver,
  getMinSelectableDateInVancouver, 
  isDateDisabledInVancouver, 
  formatDateForAPI,
  getCurrentVancouverTime
} from "../services/timezoneService";
import TeeTimeCards, { TeeTimeCardsRef } from "@/components/TeeTimeCards";

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

export default function Home() {
  // State for filters
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [fetchedDates, setFetchedDates] = useState<Date[] | undefined>(undefined);
  const [numOfPlayers, setNumOfPlayers] = useState<number>(4);
  const [holes, setHoles] = useState(18);
  const [timeRange, setTimeRange] = useState<number[]>([5, 22]); // 5am to 10pm
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'startTime' | 'priceAsc' | 'priceDesc' | 'rating'>('startTime');
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseCityMapping, setCourseCityMapping] = useState<Record<string, string>>({});
  
  // Subscription component state
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionShown, setSubscriptionShown] = useState(false);
  const [subscriptionDismissed, setSubscriptionDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const resultsSectionRef = useRef<TeeTimeCardsRef>(null);

  // Check sessionStorage and set mobile state on component mount
  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    const dismissed = sessionStorage.getItem('subscription-dismissed') === 'true';
    setSubscriptionDismissed(dismissed);
    
    // Set mobile state after hydration
    setIsMobile(window.innerWidth < 1024);
    
    // Set initial time
    setCurrentTime(getCurrentVancouverTime());
    
    // Initialize dates after hydration
    const today = getVancouverToday();
    setTodayDate(today);
    setSelectedDates([today]);
    setFetchedDates([today]);
    
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Update time every minute
    const updateTime = () => {
      setCurrentTime(getCurrentVancouverTime());
    };
    
    const timeInterval = setInterval(updateTime, 60000); // Update every minute
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(timeInterval);
    };
  }, []);

  // Fetch cities and courses on component mount
  useEffect(() => {
    const loadCitiesAndCourses = async () => {
      setCitiesLoading(true);
      setCoursesLoading(true);
      try {
        const courseCityData = await fetchCourseDisplayNamesAndTheirCities();
        
        // Check if data is valid
        if (!courseCityData || typeof courseCityData !== 'object') {
          throw new Error('Invalid data format received from API');
        }
        
        // Extract courses (keys) and cities (values)
        const courseNames = Object.keys(courseCityData);
        const cityNames = [...new Set(Object.values(courseCityData) as string[])].sort((a: string, b: string) => a.localeCompare(b));
        
        setCourseCityMapping(courseCityData);
        setCourses(courseNames);
        setCities(cityNames);
      } catch (error) {
        console.error('Failed to fetch cities or courses:', error);
        // Fallback to empty arrays if fetch fails
        setCourseCityMapping({});
        setCities([]);
        setCourses([]);
      } finally {
        setCitiesLoading(false);
        setCoursesLoading(false);
      }
    };

    loadCitiesAndCourses();
  }, []);

  // Scroll detection for subscription component
  useEffect(() => {
    if (!teeTimes.length || subscriptionShown || subscriptionDismissed) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (isMobile) {
        // On mobile, check if page has scrolled down significantly
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        if (scrollY > windowHeight * 0.6) { // Show after 60% of viewport height (increased from 30%)
          // Add a small delay to prevent immediate triggering
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            setShowSubscription(true);
            setSubscriptionShown(true);
          }, 500); // 500ms delay
        }
      } else {
        // On desktop, check if scrollable div has scrolled
        const scrollableElement = resultsSectionRef.current?.scrollableElement;
        if (scrollableElement) {
          const scrollTop = scrollableElement.scrollTop;
          const clientHeight = scrollableElement.clientHeight;
          
          if (scrollTop > clientHeight * 0.5) { // Show after 50% of results section height
            setShowSubscription(true);
            setSubscriptionShown(true);
          }
        }
      }
    };

    // Capture the current ref value to use in cleanup
    const currentScrollableElement = resultsSectionRef.current?.scrollableElement;

    if (isMobile) {
      window.addEventListener('scroll', handleScroll);
    } else {
      if (currentScrollableElement) {
        currentScrollableElement.addEventListener('scroll', handleScroll);
      }
    }

    return () => {
      clearTimeout(scrollTimeout);
      if (isMobile) {
        window.removeEventListener('scroll', handleScroll);
      } else {
        if (currentScrollableElement) {
          currentScrollableElement.removeEventListener('scroll', handleScroll);
        }
      }
    };
  }, [teeTimes.length, subscriptionShown, subscriptionDismissed, isMobile]);

  // Reset subscription state when new search is performed
  useEffect(() => {
    setShowSubscription(false);
    setSubscriptionShown(false);
  }, [fetchedDates]);

  // Function to format hour for display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  // Handle subscription dismissal
  const handleSubscriptionDismiss = () => {
    setSubscriptionDismissed(true);
    setShowSubscription(false);
    setSubscriptionShown(true);
  };

  // Function to fetch tee times
  const handleGetTeeTimes = async () => {
    if (!selectedDates || selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log('Selected dates:', selectedDates);
      
      const formattedDates = selectedDates.map(date => formatDateForAPI(date));
      console.log('Formatted dates:', formattedDates);
      const data = await fetchTeeTimes({
        dates: formattedDates, // Array of YYYY-MM-DD strings
        numOfPlayers,
        holes
      });
      setTeeTimes(data);
      setFetchedDates(selectedDates);
    } catch (err) {
      setError('Failed to fetch tee times. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      
      // Auto-scroll to results section after loading is complete
      setTimeout(() => {
        if (isMobile) {
          // On mobile, scroll the window to the results section
          const sectionElement = resultsSectionRef.current?.sectionElement;
          if (sectionElement) {
            sectionElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        } else {
          // On desktop, scroll to top of the scrollable div
          const scrollableElement = resultsSectionRef.current?.scrollableElement;
          if (scrollableElement) {
            scrollableElement.scrollTo({ 
              top: 0, 
              behavior: 'smooth' 
            });
          }
        }
      }, 100); // Small delay to ensure DOM is updated
    }
  };

  // Convert cities and courses to react-select format
  const cityOptions = cities.map(city => ({
    value: city, 
    label: city
  }));
  
  const courseOptions = courses.map(course => {
    const courseCity = courseCityMapping[course];
    const isDisabled = selectedCities.length > 0 && !selectedCities.includes(courseCity);
    return { 
      value: course, 
      label: course, 
      isDisabled: isDisabled,
      city: courseCity 
    };
  });

  // Handle city selection changes
  const handleCityChange = (selectedOptions: MultiValue<SelectOption>) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    const previousCities = selectedCities;
    setSelectedCities(values);
    
    // Find newly added cities
    const addedCities = values.filter(city => !previousCities.includes(city));
    
    // Find courses that belong to the newly added cities
    const coursesToAdd = addedCities.length > 0 
      ? Object.keys(courseCityMapping).filter(courseName => 
          addedCities.includes(courseCityMapping[courseName])
        )
      : [];
    
    // Update selected courses
    if (values.length > 0) {
      // Add courses from newly selected cities and keep courses from still-selected cities
      const updatedCourses = [
        ...new Set([
          ...selectedCourses.filter(courseName => {
            const courseCity = courseCityMapping[courseName];
            return courseCity && values.includes(courseCity);
          }),
          ...coursesToAdd
        ])
      ];
      setSelectedCourses(updatedCourses);
    } else {
      // If no cities are selected, clear all courses
      setSelectedCourses([]);
    }
  };

  // Handle course selection changes
  const handleCourseChange = (selectedOptions: MultiValue<SelectOption>) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setSelectedCourses(values);
    
    // Remove selected cities that don't have any of the selected courses
    if (values.length > 0) {
      const validCities = [...new Set(values.map(courseName => courseCityMapping[courseName]).filter(Boolean))];
      const filteredCities = selectedCities.filter(cityName => validCities.includes(cityName));
      if (filteredCities.length !== selectedCities.length) {
        setSelectedCities(filteredCities);
      }
    }
  };

  // Custom styles for React Select
  const selectStyles: StylesConfig<SelectOption, true> = {
    control: (provided) => ({
      ...provided,
      minHeight: '42px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      '&:hover': {
        borderColor: '#cbd5e0'
      },
      '&:focus-within': {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#3b82f6',
      borderRadius: '4px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '12px'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#2563eb',
        color: 'white'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#9ca3af' : provided.color,
      backgroundColor: state.isDisabled 
        ? '#f9fafb' 
        : state.isSelected 
          ? '#3b82f6' 
          : state.isFocused 
            ? '#eff6ff' 
            : 'white',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
      '&:hover': {
        backgroundColor: state.isDisabled 
          ? '#f9fafb' 
          : state.isSelected 
            ? '#3b82f6' 
            : '#eff6ff'
      }
    })
  };

  // Common props for React Select to fix aria-activedescendant issue
  const commonSelectProps = {
    'aria-activedescendant': '',
    inputProps: {
      'aria-activedescendant': ''
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4 sm:p-10 lg:p-0 font-[family-name:var(--font-geist-sans)]">
      <main className="w-full flex flex-col lg:flex-row lg:h-screen gap-8 lg:gap-0">
        {/* Settings Section - Fixed on left for desktop, top for mobile */}
        <section className="w-full lg:w-80 flex-shrink-0 bg-white shadow p-6 flex flex-col gap-3 lg:gap-4 lg:h-screen lg:sticky lg:top-0 lg:mr-8 rounded-xl lg:rounded-none lg:rounded-r-xl lg:justify-between relative z-20">
          {/* Filter Controls - Takes available space on desktop */}
          <div className="flex flex-col gap-4 lg:gap-4 lg:flex-1">
            <div className="flex flex-col items-center">
              
              <div className="rounded-lg border shadow-sm">
                {isClient ? (
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={setSelectedDates}
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
              </div>
            </div>

            {/* Players and Holes Row */}
            <div className="flex gap-6">
              {/* Players Selector */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Players</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setNumOfPlayers(num)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                        numOfPlayers === num
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                          : 'bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:border-blue-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holes Dropdown */}
              <div className="flex-1 flex flex-col gap-3">
                <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Holes</span>
                <Listbox value={holes} onChange={setHoles}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-200 transition-colors font-medium text-slate-700">
                      <span>{holes}</span>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none">
                      {[18, 9].map((option) => (
                        <Listbox.Option
                          key={option}
                          value={option}
                          className={({ active }) =>
                            `px-4 py-2 cursor-pointer font-medium ${
                              active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                            }`
                          }
                        >
                          {option}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            </div>

            {/* Time Range Filter */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Time Range</span>
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
                          transform: 'translateY(-50%)',
                          top: '0%'
                        }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    );
                  }}
                />
                <div className="flex justify-between mt-3 text-sm font-medium text-slate-600">
                  <span>{formatHour(timeRange[0])}</span>
                  <span>{formatHour(timeRange[1])}</span>
                </div>
              </div>
            </div>

            {/* Cities Filter */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                  Cities{selectedCities.length > 0 ? ` (${selectedCities.length})` : ''}
                </span>
              </div>
                          <Select
              isMulti
              closeMenuOnSelect={false}
              options={cityOptions}
              value={cityOptions.filter(option => selectedCities.includes(option.value))}
              onChange={handleCityChange}
              placeholder="Filter by cities..."
              isSearchable
              isLoading={citiesLoading}
              noOptionsMessage={() => citiesLoading ? "Loading cities..." : "No cities found"}
              menuPlacement="top"
              styles={selectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              instanceId="cities-select"
              {...commonSelectProps}
            />
            </div>

            {/* Courses Filter */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <LandPlot className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                  Courses{selectedCourses.length > 0 ? ` (${selectedCourses.length})` : ''}
                </span>
              </div>
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={courseOptions}
                value={courseOptions.filter(option => selectedCourses.includes(option.value))}
                onChange={handleCourseChange}
                placeholder="Filter by courses..."
                isSearchable
                isLoading={coursesLoading}
                noOptionsMessage={() => coursesLoading ? "Loading courses..." : "No courses found"}
                isOptionDisabled={(option) => option.isDisabled || false}
                menuPlacement="top"
                styles={selectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                instanceId="courses-select"
                {...commonSelectProps}
              />
            </div>
          </div>

          {/* Get Tee Times Button - Pinned to bottom on desktop */}
          <button
            onClick={handleGetTeeTimes}
            disabled={loading || !selectedDates || selectedDates.length === 0}
            className={`mt-8 lg:mt-0 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading || !selectedDates || selectedDates.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? 'Searching...' : 'Get Tee Times'}
          </button>
        </section>

        {/* Tee Times Results Section - Scrollable */}
        {/* On mobile, only show results section if there are results, loading, or error */}
        {/* On desktop, always show to display initial state */}
        {(!isMobile || teeTimes.length > 0 || loading || !!error) && (
          <div className="flex-1 lg:p-10 lg:pl-0 lg:pr-10 lg:py-10 px-4 sm:px-10 lg:px-0">
            <TeeTimeCards
              ref={resultsSectionRef}
              teeTimes={teeTimes}
              loading={loading}
              error={error}
              timeRange={timeRange}
              citiesFilterEnabled={true}
              selectedCities={selectedCities}
              coursesFilterEnabled={true}
              selectedCourses={selectedCourses}
              fetchedDates={fetchedDates}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showSubscription={showSubscription}
              setShowSubscription={setShowSubscription}
              handleSubscriptionDismiss={handleSubscriptionDismiss}
              isMobile={isMobile}
              hasSearched={teeTimes.length > 0 || loading || !!error}
              courseCityMapping={courseCityMapping}
            />
          </div>
        )}
      </main>
    </div>
  );
}
