"use client";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Users, Clock, School, LandPlot } from "lucide-react";
import { Range } from "react-range";
import Select, { MultiValue, StylesConfig } from 'react-select';
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCourseDisplayNamesAndTheirCities } from "../services/supabaseService";
import {
  isPastDateInVancouver,
  getMinSelectableDateInVancouver, 
  isDateDisabledInVancouver
} from "../services/timezoneService";

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

interface SidebarProps {
  selectedDates: Date[] | undefined;
  setSelectedDates: (dates: Date[] | undefined) => void;
  numOfPlayers: number;
  setNumOfPlayers: (num: number) => void;
  holes: number;
  setHoles: (holes: number) => void;
  timeRange: number[];
  setTimeRange: (range: number[]) => void;
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  selectedCourses: string[];
  setSelectedCourses: (courses: string[]) => void;
  removedCourses: string[];
  loading: boolean;
  onGetTeeTimes: () => void;
  isClient: boolean;
  todayDate: Date | null;
  setCourseCityMapping: (mapping: Record<string, string>) => void;
}

export default function Sidebar({
  selectedDates,
  setSelectedDates,
  numOfPlayers,
  setNumOfPlayers,
  holes,
  setHoles,
  timeRange,
  setTimeRange,
  selectedCities,
  setSelectedCities,
  selectedCourses,
  setSelectedCourses,
  removedCourses,
  loading,
  onGetTeeTimes,
  isClient,
  todayDate,
  setCourseCityMapping
}: SidebarProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [localCourseCityMapping, setLocalCourseCityMapping] = useState<Record<string, string>>({});
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  // Fetch cities and courses on component mount
  useEffect(() => {
    const loadCitiesAndCourses = async () => {
      setCitiesLoading(true);
      setCoursesLoading(true);
      try {
        const courseCityData = await fetchCourseDisplayNamesAndTheirCities();
        
        if (!courseCityData || typeof courseCityData !== 'object') {
          throw new Error('Invalid data format received from API');
        }
        
        const courseNames = Object.keys(courseCityData);
        const cityNames = [...new Set(Object.values(courseCityData) as string[])].sort((a: string, b: string) => a.localeCompare(b));
        
        setLocalCourseCityMapping(courseCityData);
        setCourseCityMapping(courseCityData);
        setCourses(courseNames);
        setCities(cityNames);
      } catch (error) {
        console.error('Failed to fetch cities or courses:', error);
        setLocalCourseCityMapping({});
        setCourseCityMapping({});
        setCities([]);
        setCourses([]);
      } finally {
        setCitiesLoading(false);
        setCoursesLoading(false);
      }
    };

    loadCitiesAndCourses();
  }, [setCourseCityMapping]);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const cityOptions = cities.map(city => ({
    value: city, 
    label: city
  }));
  
  const courseOptions = courses
    .filter(course => !removedCourses.includes(course))
    .map(course => {
      const courseCity = localCourseCityMapping[course];
      const isDisabled = selectedCities.length > 0 && !selectedCities.includes(courseCity);
      return { 
        value: course, 
        label: course, 
        isDisabled: isDisabled,
        city: courseCity 
      };
    });

  const handleCityChange = (selectedOptions: MultiValue<SelectOption>) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    const previousCities = selectedCities;
    setSelectedCities(values);
    
    const addedCities = values.filter(city => !previousCities.includes(city));
    
    const coursesToAdd = addedCities.length > 0 
      ? Object.keys(localCourseCityMapping).filter(courseName => 
          addedCities.includes(localCourseCityMapping[courseName])
        )
      : [];
    
    if (values.length > 0) {
      const updatedCourses = [
        ...new Set([
          ...selectedCourses.filter(courseName => {
            const courseCity = localCourseCityMapping[courseName];
            return courseCity && values.includes(courseCity);
          }),
          ...coursesToAdd
        ])
      ];
      setSelectedCourses(updatedCourses);
    } else {
      setSelectedCourses([]);
    }
  };

  const handleCourseChange = (selectedOptions: MultiValue<SelectOption>) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setSelectedCourses(values);
    
    if (values.length > 0) {
      const validCities = [...new Set(values.map(courseName => localCourseCityMapping[courseName]).filter(Boolean))];
      const filteredCities = selectedCities.filter(cityName => validCities.includes(cityName));
      if (filteredCities.length !== selectedCities.length) {
        setSelectedCities(filteredCities);
      }
    }
  };

  const handleCityToggle = () => {
    if (showCitySelector) {
      // Switching to "Custom" - clear city filters
      setSelectedCities([]);
      setSelectedCourses([]);
    }
    setShowCitySelector(!showCitySelector);
  };

  const handleCourseToggle = () => {
    if (showCourseSelector) {
      // Switching from "Custom" to "All" 
      // Only clear course filters if city toggle is also on "All"
      if (!showCitySelector) {
        setSelectedCourses([]);
      }
    }
    setShowCourseSelector(!showCourseSelector);
  };

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

  const commonSelectProps = {
    'aria-activedescendant': '',
    inputProps: {
      'aria-activedescendant': ''
    }
  };

  return (
    <section className="w-full lg:w-80 flex-shrink-0 bg-white shadow p-6 flex flex-col gap-3 lg:gap-4 lg:h-screen lg:sticky lg:top-0 lg:mr-8 rounded-xl lg:rounded-none lg:rounded-r-xl lg:justify-between relative z-20">
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

        <div className="flex gap-6">
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

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Cities{showCitySelector && selectedCities.length > 0 ? ` (${selectedCities.length})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!showCitySelector && <span className="text-xs font-medium text-slate-600">All</span>}
              <button
                onClick={handleCityToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showCitySelector
                    ? 'bg-slate-300 hover:bg-slate-400'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                role="switch"
                aria-checked={showCitySelector}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                    showCitySelector ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">{showCitySelector ? 'Custom' : 'All'}</span>
              </button>
            </div>
          </div>
          {showCitySelector && (
            citiesLoading ? (
              <Skeleton className="h-[42px] w-full rounded-lg" />
            ) : (
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={cityOptions}
                value={cityOptions.filter(option => selectedCities.includes(option.value))}
                onChange={handleCityChange}
                placeholder="Filter by cities..."
                isSearchable
                noOptionsMessage={() => "No cities found"}
                menuPlacement="top"
                styles={selectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                instanceId="cities-select"
                {...commonSelectProps}
              />
            )
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LandPlot className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Courses{showCourseSelector && selectedCourses.length > 0 ? ` (${selectedCourses.length})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!showCourseSelector && <span className="text-xs font-medium text-slate-600">All</span>}
              <button
                onClick={handleCourseToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showCourseSelector
                    ? 'bg-slate-400 hover:bg-slate-500'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                role="switch"
                aria-checked={showCourseSelector}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                    showCourseSelector ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">{showCourseSelector ? 'Custom' : 'All'}</span>
              </button>
            </div>
          </div>
          {showCourseSelector && (
            coursesLoading ? (
              <Skeleton className="h-[42px] w-full rounded-lg" />
            ) : (
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={courseOptions}
                value={courseOptions.filter(option => selectedCourses.includes(option.value))}
                onChange={handleCourseChange}
                placeholder="Filter by courses..."
                isSearchable
                noOptionsMessage={() => "No courses found"}
                isOptionDisabled={(option) => option.isDisabled || false}
                menuPlacement="top"
                styles={selectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                instanceId="courses-select"
                {...commonSelectProps}
              />
            )
          )}
        </div>
      </div>

      <button
        onClick={onGetTeeTimes}
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
  );
} 