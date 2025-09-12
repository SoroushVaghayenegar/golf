"use client";
import posthog from 'posthog-js';
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchRegions } from "@/services/supabaseService";
import {
  getVancouverToday,
  formatDateForAPI
} from "@/services/timezoneService";
import TeeTimeCards, { TeeTimeCardsRef } from "@/components/TeeTimeCards";
import MobileTeeTimeCards from "@/components/MobileTeeTimeCards";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import TeeTimesShareBar from "@/components/TeeTimesShareBar";
import { useAppStore } from '@/stores/appStore'
import { checkLocationPermission } from "@/utils/Geo";

// Custom hook for managing region with localStorage persistence
const useRegionIdWithStorage = (defaultRegionId: string = '1') => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>(defaultRegionId);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedRegion = localStorage.getItem('selectedRegion');
    if (savedRegion) {
      setSelectedRegionId(savedRegion);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever region changes
  const setRegionWithStorage = (region: string) => {
    posthog.capture('region_changed', {
      new_region: region,
      previous_region: selectedRegionId
    });
    setSelectedRegionId(region);
    localStorage.setItem('selectedRegion', region);
  };

  return { selectedRegionId, setSelectedRegionId: setRegionWithStorage, isInitialized };
};

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // State for filters
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [fetchedDates, setFetchedDates] = useState<Date[] | undefined>(undefined);
  const [numOfPlayers, setNumOfPlayers] = useState<string>("any");
  const [holes, setHoles] = useState<string>("any");
  const [timeRange, setTimeRange] = useState<number[]>([5, 22]); // 5am to 10pm
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [removedCourseIds, setRemovedCourseIds] = useState<number[]>([]);
  const {selectedRegionId, setSelectedRegionId, isInitialized } = useRegionIdWithStorage();
  const [sortBy, setSortBy] = useState<'startTime' | 'closest' | 'priceAsc' | 'priceDesc' | 'rating'>('startTime');
  // tee times now from store
  const teeTimes = useAppStore((s) => s.teeTimes)
  const loading = useAppStore((s) => s.teeTimesLoading)
  const storeError = useAppStore((s) => s.teeTimesError)
  const fetchTeeTimesAction = useAppStore((s) => s.fetchTeeTimesAction)
  const [hasEverSearched, setHasEverSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseCityMapping, setCourseCityMapping] = useState<Record<string, string>>({});
  const [regionTimeZone, setRegionTimeZone] = useState<string | undefined>(undefined);
  const [regionsMap, setRegionsMap] = useState<Record<string, { label: string; timezone?: string }>>({});
  // URL hydration helpers
  const [pendingCitiesFromURL, setPendingCitiesFromURL] = useState<string[] | null>(null);
  const [pendingCoursesFromURL, setPendingCoursesFromURL] = useState<string[] | null>(null);
  const [pendingCourseIdsFromURL, setPendingCourseIdsFromURL] = useState<string[] | null>(null);
  const [hadDatesInURL, setHadDatesInURL] = useState<boolean>(false);
  const [hadRegionInURL, setHadRegionInURL] = useState<boolean>(false);
  const [hadCourseIdsParam, setHadCourseIdsParam] = useState<boolean>(false);
  const [urlFiltersApplied, setUrlFiltersApplied] = useState<boolean>(false);
  const [courseIdToName, setCourseIdToName] = useState<Record<string, string>>({});
  const [forceShowCourseSelector, setForceShowCourseSelector] = useState<boolean | null>(null);
  const [forceShowCitySelector, setForceShowCitySelector] = useState<boolean | null>(null);
  const [rawCourseIdsCSV, setRawCourseIdsCSV] = useState<string | null>(null);
  const [hasParsedURL, setHasParsedURL] = useState<boolean>(false);
  
  // Subscription component state
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionShown, setSubscriptionShown] = useState(false);
  const [subscriptionDismissed, setSubscriptionDismissed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [visibleTeeTimeCount, setVisibleTeeTimeCount] = useState(0);
  const resultsSectionRef = useRef<TeeTimeCardsRef>(null);
  const initialAutoSearchTriggeredRef = useRef(false);
  const lastQueryKeyRef = useRef<string | null>(null);

  // Check localStorage and set mobile state on component mount
  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    const dismissed = localStorage.getItem('subscription-dismissed') === 'true';
    setSubscriptionDismissed(dismissed);
    const shown = localStorage.getItem('subscription-shown') === 'true';
    setSubscriptionShown(shown);
    
    // Set mobile state after hydration
    setIsMobile(window.innerWidth < 1024);
    
    // Initialize dates after hydration
    const today = getVancouverToday();
    setTodayDate(today);
    setSelectedDates([today]);
    setFetchedDates([today]);
    
    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load regions once and keep a map for timezone lookup
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regions = await fetchRegions();
        const map: Record<string, { label: string; timezone?: string }> = {};
        regions.forEach((r: { value: number | string; label: string; timezone?: string }) => {
          map[String(r.value)] = { label: r.label, timezone: r.timezone };
        });
        setRegionsMap(map);
      } catch {
        // noop – fallback to default timezone downstream
      }
    };
    loadRegions();
  }, []);

  // Update effective timezone whenever selected region changes or regions finish loading
  useEffect(() => {
    const tz = regionsMap[selectedRegionId]?.timezone;
    setRegionTimeZone(tz);
  }, [selectedRegionId, regionsMap]);

  // Parse URL params and hydrate filters
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const search = window.location.search || '';
      const params = new URLSearchParams(search);

      // Dates: comma-separated YYYY-MM-DD (parse safely to avoid timezone shift)
      const datesParam = params.get('dates');
      if (datesParam) {
        const parsedDates: Date[] = datesParam
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => {
            const [y, m, day] = d.split('-').map((x) => Number(x));
            if (!y || !m || !day) return null;
            // Create a local Date at midnight to avoid implicit UTC parsing
            return new Date(y, m - 1, day);
          })
          .filter((d): d is Date => !!d && !isNaN(d.getTime()));
        if (parsedDates.length > 0) {
          setSelectedDates(parsedDates);
          setHadDatesInURL(true);
        }
      }
      // If dates is missing entirely, redirect back to home
      if (!datesParam) {
        router.replace('/');
        return;
      }

      // Players
      const playersParam = params.get('players') || params.get('numOfPlayers');
      if (playersParam && ["1","2","3","4","any"].includes(playersParam)) {
        setNumOfPlayers(playersParam);
      }

      // Holes
      const holesParam = params.get('holes');
      if (holesParam && ["9","18","any"].includes(holesParam)) {
        setHoles(holesParam);
      }

      // Time range: support start/end or timeRange=5-22 or 5,22
      const startParam = params.get('start') || params.get('startTime');
      const endParam = params.get('end') || params.get('endTime');
      const rangeParam = params.get('timeRange');
      let startHour: number | null = null;
      let endHour: number | null = null;
      if (startParam && !Number.isNaN(Number(startParam))) startHour = Number(startParam);
      if (endParam && !Number.isNaN(Number(endParam))) endHour = Number(endParam);
      if (rangeParam && (!startHour || !endHour)) {
        const parts = rangeParam.split(/[-,]/).map((x) => x.trim());
        if (parts.length === 2) {
          const s = Number(parts[0]);
          const e = Number(parts[1]);
          if (!Number.isNaN(s)) startHour = s;
          if (!Number.isNaN(e)) endHour = e;
        }
      }
      if (startHour !== null && endHour !== null) {
        const clampedStart = Math.max(0, Math.min(23, startHour));
        const clampedEnd = Math.max(0, Math.min(23, endHour));
        if (clampedStart <= clampedEnd) {
          setTimeRange([clampedStart, clampedEnd]);
        }
      }

      // Sort
      const sortParam = params.get('sort');
      if (sortParam && ['startTime','closest','priceAsc','priceDesc','rating'].includes(sortParam)) {
        if (sortParam === 'closest') {
          // For URL parameters, silently fall back to startTime if location permission not available
          // We don't want to prompt user for permission during page load
          checkLocationPermission().then(hasPermission => {
            if (hasPermission) {
              setSortBy('closest');
            } else {
              setSortBy('startTime');
            }
          }).catch(() => {
            setSortBy('startTime');
          });
        } else {
          setSortBy(sortParam as typeof sortBy);
        }
      }

      // Region
      const regionParam = params.get('region') || params.get('region_id') || params.get('regionId');
      if (regionParam) {
        setSelectedRegionId(regionParam);
        setHadRegionInURL(true);
      }

      // Cities and courses - apply after courseCityMapping loads
      const citiesParam = params.get('cities');
      const coursesParam = params.get('courses');
      const courseIdsParam = params.get('courseIds') || params.get('course_ids');
      if (citiesParam) setPendingCitiesFromURL(citiesParam.split(',').map((c) => c.trim()).filter(Boolean));
      if (coursesParam) setPendingCoursesFromURL(coursesParam.split(',').map((c) => c.trim()).filter(Boolean));
      if (courseIdsParam) {
        setPendingCourseIdsFromURL(courseIdsParam.split(',').map((c) => c.trim()).filter(Boolean));
        setHadCourseIdsParam(true);
        setRawCourseIdsCSV(courseIdsParam);
        // Ensure course selector is visible when courseIds are present
        setForceShowCourseSelector(true);
      } else {
        setHadCourseIdsParam(false);
        setRawCourseIdsCSV(null);
      }

      // Ensure city and course selectors are visible when corresponding URL params are present
      if (citiesParam) {
        setForceShowCitySelector(true);
      }
      if (coursesParam) {
        setForceShowCourseSelector(true);
      }

      // Parse removedCourseIds from URL
      const removedCourseIdsParam = params.get('removedCourseIds');
      if (removedCourseIdsParam) {
        const removedCourseIdsArray = removedCourseIdsParam.split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
        setRemovedCourseIds(removedCourseIdsArray);
      }

    } catch (e) {
      console.error('Failed to parse URL params', e);
    } finally {
      setHasParsedURL(true);
    }
  }, [isInitialized]);

  // Once course/city mapping is available, validate and apply pending cities/courses
  useEffect(() => {
    const mappingReady = courseCityMapping && Object.keys(courseCityMapping).length > 0;
    if (!mappingReady) return;

    let appliedSomething = false;
    if (pendingCitiesFromURL) {
      const availableCities = new Set(Object.values(courseCityMapping));
      const validCities = pendingCitiesFromURL.filter((c) => availableCities.has(c));
      setSelectedCities(validCities);
      setPendingCitiesFromURL(null);
      appliedSomething = true;
    }
    if (pendingCoursesFromURL) {
      const availableCourses = new Set(Object.keys(courseCityMapping));
      const validCourses = pendingCoursesFromURL.filter((c) => availableCourses.has(c));
      setSelectedCourses(validCourses);
      setPendingCoursesFromURL(null);
      appliedSomething = true;
    }
    if (pendingCourseIdsFromURL && courseIdToName && Object.keys(courseIdToName).length > 0) {
      const names = pendingCourseIdsFromURL
        .map((id) => courseIdToName[id])
        .filter((name): name is string => !!name);
      if (names.length) {
        setSelectedCourses(Array.from(new Set(names)));
        appliedSomething = true;
        if (hadCourseIdsParam) setForceShowCourseSelector(true);
      } else {
        if (hadCourseIdsParam) setForceShowCourseSelector(true);
      }
      setPendingCourseIdsFromURL(null);
    }
    if (appliedSomething) {
      setUrlFiltersApplied(true);
    }
  }, [courseCityMapping, pendingCitiesFromURL, pendingCoursesFromURL, pendingCourseIdsFromURL, courseIdToName, hadCourseIdsParam]);

  // Auto-trigger search once hydrated from URL and mandatory inputs present
  useEffect(() => {
    if (initialAutoSearchTriggeredRef.current) return;
    if (!(hadDatesInURL && (hadRegionInURL || !!selectedRegionId))) return;
    if (!selectedDates || selectedDates.length === 0) return;
    if (urlFiltersApplied || (!pendingCitiesFromURL && !pendingCoursesFromURL && !pendingCourseIdsFromURL)) {
      initialAutoSearchTriggeredRef.current = true;
      const id = setTimeout(() => {
        handleGetTeeTimes();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [hadDatesInURL, hadRegionInURL, selectedRegionId, selectedDates, urlFiltersApplied, pendingCitiesFromURL, pendingCoursesFromURL, pendingCourseIdsFromURL]);

  // Helper to format a Date as YYYY-MM-DD without timezone shifts
  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Stable key representing the effective search filters
  const getQueryKey = () => {
    const dates = (selectedDates || []).map(formatDateLocal).join(',');
    const cities = [...selectedCities].sort().join(',');
    const courses = [...selectedCourses].sort().join(',');
    const range = timeRange && timeRange.length === 2 ? `${timeRange[0]}-${timeRange[1]}` : '';
    // Do NOT include sortBy in the key so sorting doesn't trigger a refetch
    return [dates, numOfPlayers, holes, range, selectedRegionId || '', cities, courses].join('|');
  };

  // Keep URL in sync with current filters
  useEffect(() => {
    if (!pathname || !hasParsedURL) return;
    // Build params from current state
    const params = new URLSearchParams();
    if (selectedDates && selectedDates.length > 0) {
      params.set('dates', selectedDates.map(formatDateLocal).join(','));
    }
    if (numOfPlayers) params.set('players', numOfPlayers);
    if (holes) params.set('holes', holes);
    if (timeRange && timeRange.length === 2) {
      params.set('timeRange', `${timeRange[0]}-${timeRange[1]}`);
    }
    if (selectedRegionId) params.set('region', selectedRegionId);
    if (sortBy) params.set('sort', sortBy);

    // Prefer courseIds if mapping is available
    if (selectedCourses.length > 0) {
      const ids: string[] = [];
      if (courseIdToName && Object.keys(courseIdToName).length > 0) {
        for (const [id, name] of Object.entries(courseIdToName)) {
          if (selectedCourses.includes(name)) ids.push(id);
        }
      }
      if (ids.length > 0) {
        params.set('courseIds', ids.join(','));
      } else {
        // Fallback to course names if ids are not available
        params.set('courses', selectedCourses.join(','));
      }
    }

    if (selectedCities.length > 0) {
      params.set('cities', selectedCities.join(','));
    }

    if (removedCourseIds.length > 0) {
      const validRemovedIds = Array.from(new Set(removedCourseIds.filter((id) => Number.isFinite(id))));
      if (validRemovedIds.length > 0) {
        params.set('removedCourseIds', validRemovedIds.join(','));
      }
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    // Replace to avoid stacking history entries
    router.replace(url);
  }, [pathname, router, hasParsedURL, selectedDates, numOfPlayers, holes, timeRange, selectedCities, selectedCourses, removedCourseIds, sortBy, selectedRegionId, courseIdToName, hadCourseIdsParam, rawCourseIdsCSV]);

  // Tee time count-based subscription trigger
  useEffect(() => {
    if (!teeTimes.length || subscriptionShown || subscriptionDismissed) return;

    // Only consider showing after mobile sidebar is closed on mobile
    if (isMobile && isMobileSidebarOpen) return;

    const mobileThreshold = 5;
    const desktopThreshold = 15;
    const threshold = isMobile ? mobileThreshold : desktopThreshold;

    if (visibleTeeTimeCount >= threshold) {
      setShowSubscription(true);
      setSubscriptionShown(true);
      localStorage.setItem('subscription-shown', 'true');
    }
  }, [visibleTeeTimeCount, teeTimes.length, subscriptionShown, subscriptionDismissed, isMobile, isMobileSidebarOpen]);

  const handleSubscriptionDismiss = () => {
    setShowSubscription(false);
    setSubscriptionDismissed(true);
    localStorage.setItem('subscription-dismissed', 'true');
  };

  // Course removal helper remains unchanged
  const handleRemoveCourse = (courseId: number, courseName?: string) => {
    if (Number.isFinite(courseId)) {
      setRemovedCourseIds(prev => (prev.includes(courseId) ? prev : [...prev, courseId]));
      return;
    }
    if (courseName) {
      // 1) Try reverse lookup from id->name map
      const resolvedFromMap = Object.entries(courseIdToName || {}).find(([, name]) => name === courseName)?.[0];
      const resolvedMapId = resolvedFromMap ? Number(resolvedFromMap) : NaN;
      if (Number.isFinite(resolvedMapId)) {
        setRemovedCourseIds(prev => (prev.includes(resolvedMapId) ? prev : [...prev, resolvedMapId]));
        return;
      }
      // 2) Try to find any tee time with the same course name that has a valid id
      const resolvedFromData = teeTimes.find(t => t.course_name === courseName && Number.isFinite(Number(t.course_id)))?.course_id;
      const resolvedDataId = Number(resolvedFromData);
      if (Number.isFinite(resolvedDataId)) {
        setRemovedCourseIds(prev => (prev.includes(resolvedDataId) ? prev : [...prev, resolvedDataId]));
        return;
      }
    }
  };

  // Function to fetch tee times
  const handleGetTeeTimes = async () => {
    if (!selectedDates || selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    if (!selectedRegionId) {
      setError('Please select a region');
      return;
    }

    posthog.capture('tee_times_searched', {
      dates_count: selectedDates.length,
      num_of_players: numOfPlayers,
      holes: holes,
      region: "TO-DO",
      start_time_filter: timeRange[0],
      end_time_filter: timeRange[1],
      selected_cities_count: selectedCities.length,
      selected_courses_count: selectedCourses.length,
    });
    
    const isFirstRun = !hasEverSearched;
    const startTime = Date.now();
    // Record the key for the request we're about to make
    lastQueryKeyRef.current = getQueryKey();
    setError(null);
    // Note: Don't clear removedCourseIds here as they should persist from URL params
    try {
      const formattedDates = selectedDates.map(date => formatDateForAPI(date));
      // Build optional courseIds with precedence:
      // 1) If explicit courses are selected, ONLY include those
      // 2) Else, if cities are selected, include all courses in those cities
      let courseIds: string[] | undefined = undefined;
      const nameToId: Record<string, string> = {};
      if (courseIdToName && Object.keys(courseIdToName).length > 0) {
        for (const [id, name] of Object.entries(courseIdToName)) {
          nameToId[name] = id;
        }
      }
      if (Object.keys(nameToId).length > 0) {
        const idsSet = new Set<string>();
        if (selectedCourses.length > 0) {
          // Honor explicit course selections only
          selectedCourses.forEach((courseName) => {
            const id = nameToId[courseName];
            if (id) idsSet.add(id);
          });
        } else if (selectedCities.length > 0 && courseCityMapping && Object.keys(courseCityMapping).length > 0) {
          // Fall back to city-based inclusion if no explicit courses were selected
          Object.entries(courseCityMapping).forEach(([courseName, cityName]) => {
            if (selectedCities.includes(cityName)) {
              const id = nameToId[courseName];
              if (id) idsSet.add(id);
            }
          });
        }
        if (idsSet.size > 0) {
          courseIds = Array.from(idsSet);
        }
      }

      await fetchTeeTimesAction({
        dates: formattedDates, // Array of YYYY-MM-DD strings
        numOfPlayers,
        holes,
        regionId: selectedRegionId,
        startTime: timeRange[0],
        endTime: timeRange[1],
        courseIds
      })
      setFetchedDates(selectedDates);
    } catch (err) {
      // Store already set teeTimesError; keep local user-friendly error for UI gates
      setError('Failed to fetch tee times. Please try again.');
      console.error(err);
    } finally {
      // Only keep animation minimum time for the first search
      if (isFirstRun) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsedTime);
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }
      // After finishing, keep the latest effective key in sync
      lastQueryKeyRef.current = getQueryKey();
      // Mark first search as completed AFTER loading is cleared to avoid skeletons during first load
      if (isFirstRun) {
        setHasEverSearched(true);
      }
      
      // // Auto-scroll to results section after loading is complete
      // setTimeout(() => {
      //   if (isMobile) {
      //     // On mobile, only scroll on the first search
      //     if (isFirstRun) {
      //       const sectionElement = resultsSectionRef.current?.sectionElement;
      //       if (sectionElement) {
      //         sectionElement.scrollIntoView({ 
      //           behavior: 'smooth', 
      //           block: 'start' 
      //         });
      //       }
      //     }
      //   } else {
      //     // On desktop, always scroll to top of the scrollable div
      //     const scrollableElement = resultsSectionRef.current?.scrollableElement;
      //     if (scrollableElement) {
      //       scrollableElement.scrollTo({ 
      //         top: 0, 
      //         behavior: 'smooth' 
      //       });
      //     }
      //   }
      // }, 100); // Small delay to ensure DOM is updated
    }
  };

  // Automatically run search when any filter changes after the first search
  useEffect(() => {
    if (!hasEverSearched) return;
    const nextKey = getQueryKey();
    if (lastQueryKeyRef.current === nextKey) {
      return;
    }
    // Debounce to avoid rapid successive calls while sliding time range etc.
    const id = setTimeout(() => {
      lastQueryKeyRef.current = nextKey;
      handleGetTeeTimes();
    }, 350);
    return () => clearTimeout(id);
  }, [selectedDates, numOfPlayers, holes, timeRange, selectedCities, selectedCourses, selectedRegionId]);

  return (
    <div className="min-h-screen lg:min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-slate-100 p-4 py-0 sm:p-10 lg:p-0 font-[family-name:var(--font-geist-sans)] w-full max-w-full overflow-x-hidden lg:overflow-y-hidden">
      <main className="w-full max-w-full flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] lg:min-h-[calc(100vh-64px)] gap-8 lg:gap-0 overflow-x-hidden lg:py-0 py-6">
        {isInitialized && (
          isMobile ? (
            <MobileSidebar
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              numOfPlayers={numOfPlayers}
              setNumOfPlayers={setNumOfPlayers}
              holes={holes}
              setHoles={setHoles}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              selectedCities={selectedCities}
              setSelectedCities={setSelectedCities}
              selectedCourses={selectedCourses}
              setSelectedCourses={setSelectedCourses}
              removedCourseIds={removedCourseIds}
              loading={loading}
              onGetTeeTimes={handleGetTeeTimes}
              isClient={isClient}
              todayDate={todayDate}
              setCourseCityMapping={setCourseCityMapping}
              selectedRegionId={selectedRegionId}
              setSelectedRegionId={setSelectedRegionId}
              setCourseIdToName={setCourseIdToName}
              forceShowCourseSelector={forceShowCourseSelector}
              forceShowCitySelector={forceShowCitySelector}
              hideSubmitButton
              onOpenChange={setIsMobileSidebarOpen}
            />
          ) : (
            <Sidebar
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              numOfPlayers={numOfPlayers}
              setNumOfPlayers={setNumOfPlayers}
              holes={holes}
              setHoles={setHoles}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              selectedCities={selectedCities}
              setSelectedCities={setSelectedCities}
              selectedCourses={selectedCourses}
              setSelectedCourses={setSelectedCourses}
              removedCourseIds={removedCourseIds}
              loading={loading}
              onGetTeeTimes={handleGetTeeTimes}
              isClient={isClient}
              todayDate={todayDate}
              setCourseCityMapping={setCourseCityMapping}
              selectedRegionId={selectedRegionId}
              setSelectedRegionId={setSelectedRegionId}
              setCourseIdToName={setCourseIdToName}
              forceShowCourseSelector={forceShowCourseSelector}
              forceShowCitySelector={forceShowCitySelector}
              hideSubmitButton
            />
          )
        )}

        {/* Tee Times Results Section - Scrollable */}
        {/* On mobile, only show results section if there are results, loading, or error */}
        {/* On desktop, always show to display initial state */}
        {(!isMobile || teeTimes.length > 0 || loading || !!(error || storeError) || hasEverSearched) && (
          <div className="flex-1 lg:p-10 lg:pl-10 lg:pr-10 lg:py-4 px-4 sm:px-10 lg:px-0 w-full max-w-full overflow-x-hidden lg:h-[calc(100vh-64px)] lg:min-h-[calc(100vh-64px)] flex flex-col">
            {/* Share Bar - Desktop positioning */}
            {!isMobile && <TeeTimesShareBar className="mb-4" />}
            
            <div className="flex-1 overflow-hidden">
              {(() => {
                const ResultsComponent = isMobile ? MobileTeeTimeCards : TeeTimeCards;
                return (
                  <ResultsComponent
                    ref={resultsSectionRef}
                    teeTimes={teeTimes}
                    loading={loading}
                    error={error || storeError}
                    removedCourseIds={removedCourseIds}
                    onRemoveCourse={handleRemoveCourse}
                    fetchedDates={fetchedDates}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    showSubscription={showSubscription}
                    setShowSubscription={setShowSubscription}
                    handleSubscriptionDismiss={handleSubscriptionDismiss}
                    isMobile={isMobile}
                    hasSearched={hasEverSearched}
                    courseCityMapping={courseCityMapping}
                    onTeeTimeVisibilityChange={setVisibleTeeTimeCount}
                    selectedRegionId={selectedRegionId}
                    regionTimeZone={regionTimeZone}
                    useSkeletonWhileLoading={hasEverSearched}
                    disableInitialEmptyState
                    shareUrl={currentUrl}
                  />
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Share Bar - Mobile positioning (sticks to bottom) */}
        {isMobile && <TeeTimesShareBar />}
      </main>
    </div>
  );
}