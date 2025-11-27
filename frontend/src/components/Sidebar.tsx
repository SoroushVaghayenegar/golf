"use client";
import { useState, useEffect } from "react";
import { Listbox } from "@headlessui/react";
import { ChevronDown, Users, Clock, School, LandPlot, MapPin, Info, RefreshCw } from "lucide-react";
import { Range } from "react-range";
import { MultiValue } from 'react-select';
import TeeClubSelect from "./TeeClubSelect";
import { fetchCourseDisplayNamesAndTheirCities, fetchRegions } from "../services/supabaseService";
import CompactCalendar from "./CompactCalendar";
import { useAppStore } from "@/stores/appStore";

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

interface SidebarProps {
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
  removedCourseIds: number[];
  loading: boolean;
  onGetTeeTimes: () => void;
  isClient: boolean;
  todayDate: Date | null;
  setCourseCityMapping: (mapping: Record<string, string>) => void;
  selectedRegionId: string;
  setSelectedRegionId: (regionId: string) => void;
  // Provide id->name mapping to parent so URLs can use courseIds
  setCourseIdToName?: (mapping: Record<string, string>) => void;
  // Allow parent to force show/hide course selector (used for URL hydration)
  forceShowCourseSelector?: boolean | null;
  // Allow parent to force show/hide city selector (used for URL hydration)
  forceShowCitySelector?: boolean | null;
  // When true, hide the submit button (used on search page)
  hideSubmitButton?: boolean;
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
  removedCourseIds,
  loading,
  onGetTeeTimes,
  isClient,
  todayDate,
  setCourseCityMapping,
  selectedRegionId,
  setSelectedRegionId,
  setCourseIdToName,
  forceShowCourseSelector,
  forceShowCitySelector,
  hideSubmitButton
}: SidebarProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [courses, setCourses] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [localCourseCityMapping, setLocalCourseCityMapping] = useState<Record<string, string>>({});
  const [courseNameToIdMapping, setCourseNameToIdMapping] = useState<Record<string, number>>({});
  const [courseNameToHolesMapping, setCourseNameToHolesMapping] = useState<Record<string, number[]>>({});
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [regions, setRegions] = useState<{ value: string; label: string }[]>([]);
  const [showHolesTooltip, setShowHolesTooltip] = useState(false);
  // Track slider drag state so we only commit on release
  const [pendingTimeRange, setPendingTimeRange] = useState<number[] | null>(null);
  const teeTimesCount = useAppStore((s) => s.teeTimes.length);
  const progress = useAppStore((s) => s.teeTimesProgress);

  // Respect parent instruction to show/hide course selector (once)
  useEffect(() => {
    if (forceShowCourseSelector === true) {
      setShowCourseSelector(true);
    } else if (forceShowCourseSelector === false) {
      setShowCourseSelector(false);
    }
  }, [forceShowCourseSelector]);

  // Respect parent instruction to show/hide city selector (once)
  useEffect(() => {
    if (forceShowCitySelector === true) {
      setShowCitySelector(true);
    } else if (forceShowCitySelector === false) {
      setShowCitySelector(false);
    }
  }, [forceShowCitySelector]);

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
        const idToNameMapping: Record<string, string> = {};
        const nameToIdMapping: Record<string, number> = {};
        const nameToHolesMapping: Record<string, number[]> = {};
        Object.entries(courseCityData).forEach(([courseName, courseData]) => {
          const data = courseData as { courseId: number; city: string; holes?: number[] };
          const courseId = data.courseId;
          simpleCityMapping[courseName] = data.city;
          idToNameMapping[courseId.toString()] = courseName;
          nameToIdMapping[courseName] = courseId;
          nameToHolesMapping[courseName] = data.holes ?? [9, 18];
        });
        
        setLocalCourseCityMapping(simpleCityMapping);
        setCourseCityMapping(simpleCityMapping);
        setCourseNameToIdMapping(nameToIdMapping);
        setCourseNameToHolesMapping(nameToHolesMapping);
        if (setCourseIdToName) {
          setCourseIdToName(idToNameMapping);
        }
        setCourses(courseNames);
        setCities(cityNames);
      } catch (error) {
        console.error('Failed to fetch cities or courses:', error);
        setLocalCourseCityMapping({});
        setCourseCityMapping({});
        if (setCourseIdToName) {
          setCourseIdToName({});
        }
        setCities([]);
        setCourses([]);
      } finally {
        setCitiesLoading(false);
        setCoursesLoading(false);
      }
    };

    loadCitiesAndCourses();
  }, [selectedRegionId, setCourseCityMapping, setSelectedCities, setSelectedCourses]);

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

  // When holes changes, clear any selected courses that no longer support the new holes value
  useEffect(() => {
    const holesValue = holes === "any" ? 18 : parseInt(holes);
    if (selectedCourses.length > 0 && Object.keys(courseNameToHolesMapping).length > 0) {
      const validCourses = selectedCourses.filter(courseName => {
        const courseHoles = courseNameToHolesMapping[courseName];
        return !courseHoles || courseHoles.includes(holesValue);
      });
      if (validCourses.length !== selectedCourses.length) {
        setSelectedCourses(validCourses);
      }
    }
  }, [holes, courseNameToHolesMapping, selectedCourses, setSelectedCourses]);

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
  
  // Parse holes value for filtering (default to 18 if "any")
  const selectedHolesValue = holes === "any" ? 18 : parseInt(holes);

  const courseOptions = courses
    .filter(course => {
      const courseId = courseNameToIdMapping[course];
      if (courseId && removedCourseIds.includes(courseId)) return false;
      
      // Filter by holes - only show courses that support the selected holes value
      const courseHoles = courseNameToHolesMapping[course];
      if (courseHoles && !courseHoles.includes(selectedHolesValue)) return false;
      
      return true;
    })
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
      // Switching to "All" - clear city filters but preserve selected courses
      setSelectedCities([]);
    }
    setShowCitySelector(!showCitySelector);
  };

  const handleCourseToggle = () => {
    if (showCourseSelector) {
      // Switching from "Custom" to "All" – clear selected courses
      setSelectedCourses([]);
    }
    setShowCourseSelector(!showCourseSelector);
  };


  return (
    <section className="w-full lg:w-80 flex-shrink-0 bg-white shadow p-5 flex flex-col gap-3 lg:gap-4 lg:h-[calc(100vh-64px)] lg:min-h-[calc(100vh-64px)] lg:sticky lg:top-0 rounded-xl lg:rounded-none justify-between relative z-20 mt-4 lg:mt-0 lg:overflow-hidden">
      <div className="flex flex-col gap-4 lg:gap-4 flex-1 overflow-visible lg:overflow-y-auto">
        
        
        <CompactCalendar
          selectedDates={selectedDates}
          setSelectedDates={setSelectedDates}
          isClient={isClient}
          todayDate={todayDate}
          className="w-full"
        />

        <div className="flex gap-6">
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-semibold text-slate-800 tracking-wide uppercase">Players</span>
            </div>
            <div className="flex">
              {["1", "2", "3", "4"].map((option, idx, arr) => {
                const isFirst = idx === 0;
                const isLast = idx === arr.length - 1;
                return (
                  <button
                    key={option}
                    onClick={() => setNumOfPlayers(option)}
                    className={`flex-1 px-3 py-2 border text-sm transition-all duration-200 ${
                      isFirst ? 'rounded-l-lg' : isLast ? 'rounded-r-lg' : 'rounded-none'
                    } ${
                      idx > 0 ? '-ml-px' : ''
                    } ${
                      numOfPlayers === option
                        ? 'bg-sidebar-primary text-white border-sidebar-primary shadow-md'
                        : 'bg-white hover:bg-green-200 border-slate-200 text-slate-700 hover:border-sidebar-primary'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
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
                  Some courses offer options beyond 9 or 18 holes. Contact the course directly for more information.
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </div>
            <Listbox value={holes === "any" ? "18" : holes} onChange={setHoles}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2 text-left bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sidebar-primary hover:border-sidebar-primary transition-colors font-medium text-sm text-slate-700">
                  <span>{holes === "any" ? "18" : holes}</span>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </Listbox.Button>
                <Listbox.Options className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none">
                  {[{ value: "18", label: "18" }, { value: "9", label: "9" }].map((option) => (
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
                values={pendingTimeRange ?? timeRange}
                onChange={(values) => setPendingTimeRange(values)}
                onFinalChange={(values) => {
                  setPendingTimeRange(null);
                  setTimeRange(values);
                }}
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
                      width: `${(((pendingTimeRange ?? timeRange)[1] - (pendingTimeRange ?? timeRange)[0]) / (22 - 5)) * 100}%`,
                      left: `${(((pendingTimeRange ?? timeRange)[0] - 5) / (22 - 5)) * 100}%`,
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
              <span>{formatHour((pendingTimeRange ?? timeRange)[0])}</span>
              <span>{formatHour((pendingTimeRange ?? timeRange)[1])}</span>
            </div>
          </div>
        </div>

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
            <TeeClubSelect
              options={cityOptions}
              selectedValues={selectedCities}
              onChange={handleCityChange}
              placeholder="Filter by cities..."
              instanceId="cities-select"
              isLoading={citiesLoading}
              menuPlacement="top"
            />
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
            <TeeClubSelect
              options={courseOptions}
              selectedValues={selectedCourses}
              onChange={handleCourseChange}
              placeholder="Filter by courses..."
              instanceId="courses-select"
              isLoading={coursesLoading}
              menuPlacement="top"
            />
          )}
        </div>
      </div>

      {!hideSubmitButton && (
        <button
          onClick={onGetTeeTimes}
          disabled={loading || !selectedDates || selectedDates.length === 0}
          className={`mt-[100px] lg:mt-0 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
            loading || !selectedDates || selectedDates.length === 0
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-sidebar-primary hover:bg-sidebar-primary-hover shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? 'Searching...' : 'Get Tee Times'}
        </button>
      )}
      {hideSubmitButton && (
        <div className="mt-2 flex flex-col gap-3">
          {/* Search Button */}
          <button
            onClick={onGetTeeTimes}
            disabled={loading || !selectedDates || selectedDates.length === 0}
            className={`w-full px-4 py-2.5 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              loading || !selectedDates || selectedDates.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-sidebar-primary hover:bg-sidebar-primary-hover shadow-md hover:shadow-lg'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Searching...' : 'Search Tee Times'}
          </button>
          
          {/* Progress or Results */}
          <div className="text-center">
            {loading && progress && progress.total > 0 ? (
              <div className="space-y-2">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-sidebar-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  {progress.completed} of {progress.total} courses
                  {progress.currentCourses && progress.currentCourses.length > 0 && (
                    <span className="block text-slate-500 truncate">
                      {progress.currentCourses.join(', ')}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-green-700 font-medium">
                {teeTimesCount} tee time{teeTimesCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
