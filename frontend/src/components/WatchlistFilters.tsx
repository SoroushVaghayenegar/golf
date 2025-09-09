"use client";
import { useState, useEffect } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Users, Clock, School, LandPlot, MapPin, Info } from "lucide-react";
import { Range } from "react-range";
import Select, { MultiValue, StylesConfig } from 'react-select';
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchCourseDisplayNamesAndTheirCities, fetchRegions } from "../services/supabaseService";
import CompactCalendar from "./CompactCalendar";

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

interface WatchlistFiltersProps {
  selectedDates: Date[] | undefined;
  setSelectedDates: (dates: Date[] | undefined) => void;
  numOfPlayers: string;
  setNumOfPlayers: (num: string) => void;
  holes: string;
  setHoles: (holes: string) => void;
  timeRange: number[];
  setTimeRange: (range: number[]) => void;
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  selectedCourses: string[];
  setSelectedCourses: (courses: string[]) => void;
  loading: boolean;
  onGetTeeTimes: () => void;
  isClient: boolean;
  todayDate: Date | null;
  setCourseCityMapping: (mapping: Record<string, string>) => void;
  setCourseIdMapping: (mapping: Record<string, number>) => void;
  selectedRegionId: string;
  setSelectedRegionId: (regionId: string) => void;
  calendarExpandedClassName?: string;
  createAnother?: boolean;
  setCreateAnother?: (checked: boolean) => void;
}

export default function WatchlistFilters({
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
  loading,
  onGetTeeTimes,
  isClient,
  todayDate,
  setCourseCityMapping,
  setCourseIdMapping,
  selectedRegionId,
  setSelectedRegionId,
  calendarExpandedClassName,
  createAnother,
  setCreateAnother
}: WatchlistFiltersProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [localCourseCityMapping, setLocalCourseCityMapping] = useState<Record<string, string>>({});
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [regions, setRegions] = useState<{ value: string; label: string }[]>([]);
  const [showHolesTooltip, setShowHolesTooltip] = useState(false);

  // Fetch cities and courses on component mount and when region changes
  useEffect(() => {
    const loadRegions = async () => {
      const regions = await fetchRegions();
      setRegions(regions.map((region: { value: number; label: string }) => ({
        value: region.value.toString(),
        label: region.label
      })));
    };
    loadRegions();
  }, []);

  useEffect(() => {
    const loadCitiesAndCourses = async () => {
      // Do not fetch until a region is selected
      if (!selectedRegionId) {
        return;
      }
      setCitiesLoading(true);
      setCoursesLoading(true);
      
      // Clear selected cities and courses when region changes
      setSelectedCities([]);
      setSelectedCourses([]);
      
      try {
        const courseCityData = await fetchCourseDisplayNamesAndTheirCities(selectedRegionId);
        
        if (!courseCityData || typeof courseCityData !== 'object') {
          throw new Error('Invalid data format received from API');
        }
        
        // each course has {courseId: number, city: string}
        const courseNames = Object.keys(courseCityData);
        const cityNames = [...new Set(Object.values(courseCityData).map((course: unknown) => (course as { courseId: number; city: string }).city))].sort((a: string, b: string) => a.localeCompare(b));
        
        // Create simple course name to city name mapping for local use
        const simpleCityMapping: Record<string, string> = {};
        const idMapping: Record<string, number> = {};
        Object.entries(courseCityData).forEach(([courseName, courseData]) => {
          const data = courseData as { courseId: number; city: string };
          simpleCityMapping[courseName] = data.city;
          idMapping[courseName] = data.courseId;
        });
        
        setLocalCourseCityMapping(simpleCityMapping);
        setCourseCityMapping(simpleCityMapping);
        setCourseIdMapping(idMapping);
        setCourses(courseNames);
        setCities(cityNames);
      } catch (error) {
        console.error('Failed to fetch cities or courses:', error);
        setLocalCourseCityMapping({});
        setCourseCityMapping({});
        setCourseIdMapping({});
        setCities([]);
        setCourses([]);
      } finally {
        setCitiesLoading(false);
        setCoursesLoading(false);
      }
    };

    loadCitiesAndCourses();
  }, [selectedRegionId, setCourseCityMapping, setCourseIdMapping, setSelectedCities, setSelectedCourses]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHolesTooltip && !(event.target as Element).closest('.holes-section')) {
        setShowHolesTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHolesTooltip]);

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
      maxHeight: '70px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      '&:hover': {
        borderColor: '#cbd5e0'
      },
      '&:focus-within': {
        borderColor: '#166534',
        boxShadow: '0 0 0 2px rgba(22, 101, 52, 0.1)'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '70px',
      overflow: 'auto',
      padding: '4px 8px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#166534',
      borderRadius: '4px',
      margin: '2px 4px 2px 0',
      maxWidth: 'calc(100% - 8px)'
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
        backgroundColor: '#15803d',
        color: 'white'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#9ca3af' : provided.color,
      backgroundColor: state.isDisabled 
        ? '#f9fafb' 
        : state.isSelected 
          ? '#166534'
          : state.isFocused 
            ? '#f0fdf4'
            : 'white',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
      '&:hover': {
        backgroundColor: state.isDisabled 
          ? '#f9fafb' 
          : state.isSelected 
            ? '#166534'
            : '#f0fdf4'
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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Watchlist</h2>
        <p className="text-gray-600 mb-8">
          Set your preferences below to create a watchlist that will monitor tee times matching your criteria.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <CompactCalendar
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              isClient={isClient}
              todayDate={todayDate}
              className="w-full"
              expandedContainerClassName={calendarExpandedClassName}
              selectionMode="single"
              closeOnSelect
            />

            <div className="flex gap-6">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Players</span>
                </div>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "any"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setNumOfPlayers(option)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                        numOfPlayers === option
                          ? 'bg-sidebar-primary text-white border-sidebar-primary shadow-md'
                          : 'bg-white hover:bg-sidebar-primary/10 border-slate-200 text-slate-700 hover:border-sidebar-primary'
                      }`}
                    >
                      {option === "any" ? "Any" : option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 holes-section">
                <div className="flex items-center gap-2 relative">
                  <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Holes</span>
                  <button
                    onClick={() => setShowHolesTooltip(!showHolesTooltip)}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showHolesTooltip && (
                    <div className="absolute top-6 right-0 z-50 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg">
                      Some courses offer options beyond 9 or 18 holes. Select &quot;Any&quot; to view all available formats.
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  )}
                </div>
                <Listbox value={holes} onChange={setHoles}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar-primary hover:border-sidebar-primary transition-colors font-medium text-slate-700">
                      <span>{holes === "any" ? "Any" : holes}</span>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none">
                      {[{ value: "any", label: "Any" }, { value: "18", label: "18" }, { value: "9", label: "9" }].map((option) => (
                        <Listbox.Option
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `px-4 py-2 cursor-pointer font-medium ${
                              active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-slate-700'
                            }`
                          }
                        >
                          {option.label}
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
              <div className="px-3 py-2">
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
                        className="h-2 bg-sidebar-primary rounded-full"
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
                        className="w-6 h-6 bg-sidebar-primary rounded-full shadow-lg flex items-center justify-center cursor-pointer"
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Region</span>
              </div>
              <Listbox value={selectedRegionId} onChange={setSelectedRegionId}>
                <div className="relative">
                  <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar-primary hover:border-sidebar-primary transition-colors font-medium text-slate-700">
                    <span>{regions.find(r => r.value === selectedRegionId)?.label || 'Select Region'}</span>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none">
                    {regions.map((region) => (
                      <Listbox.Option
                        key={region.value}
                        value={region.value}
                        className={({ active }) =>
                          `px-4 py-2 cursor-pointer font-medium ${
                            active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-slate-700'
                          }`
                        }
                      >
                        {region.label}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:ring-offset-2 ${
                      showCitySelector
                        ? 'bg-sidebar-primary hover:bg-sidebar-primary-hover'
                        : 'bg-slate-300 hover:bg-slate-400'
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
                    blurInputOnSelect={false}
                    onMenuOpen={() => {
                      if (window.innerWidth <= 768) {
                        const input = document.querySelector('#cities-select input');
                        if (input) {
                          (input as HTMLInputElement).style.caretColor = 'transparent';
                          (input as HTMLInputElement).style.userSelect = 'none';
                        }
                      }
                    }}
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:ring-offset-2 ${
                      showCourseSelector
                        ? 'bg-sidebar-primary hover:bg-sidebar-primary-hover'
                        : 'bg-slate-300 hover:bg-slate-400'
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
                    blurInputOnSelect={false}
                    onMenuOpen={() => {
                      if (window.innerWidth <= 768) {
                        const input = document.querySelector('#courses-select input');
                        if (input) {
                          (input as HTMLInputElement).style.caretColor = 'transparent';
                          (input as HTMLInputElement).style.userSelect = 'none';
                        }
                      }
                    }}
                    {...commonSelectProps}
                  />
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          {/* Create Another Checkbox */}
          {createAnother !== undefined && setCreateAnother && (
            <div className="mb-4 flex items-center space-x-2">
              <Checkbox
                id="createAnother"
                checked={createAnother}
                onCheckedChange={(checked) => setCreateAnother(checked as boolean)}
              />
              <label htmlFor="createAnother" className="text-sm text-gray-600">
                Create another watchlist after this one
              </label>
            </div>
          )}
          
          <button
            onClick={onGetTeeTimes}
            disabled={loading || !selectedDates || selectedDates.length === 0}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading || !selectedDates || selectedDates.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-sidebar-primary hover:bg-sidebar-primary-hover shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? 'Creating Watchlist...' : 'Create Watchlist'}
          </button>
          <p className="mt-2 text-xs text-slate-600 text-center">
            * You’ll get notified via email when matching tee times are found.
          </p>
        </div>
      </div>
    </div>
  );
}
