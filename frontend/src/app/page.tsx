"use client";
import posthog from 'posthog-js';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { 
  getToday, 
  isEvening,
} from "../services/timezoneService";
import Sidebar from "@/components/Sidebar";

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

export default function Home() {
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  // State for filters
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [numOfPlayers, setNumOfPlayers] = useState<string>("4");
  const [holes, setHoles] = useState<string>("18");
  const [timeRange, setTimeRange] = useState<number[]>([5, 22]); // 5am to 10pm
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [removedCourseIds] = useState<number[]>([]);
  const {selectedRegionId, setSelectedRegionId, isInitialized } = useRegionIdWithStorage();
  const [loading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [, setCourseCityMapping] = useState<Record<string, string>>({});

  const scrollToSidebar = () => {
    sidebarRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);

    // Initialize dates after hydration
    const today = getToday();
    setTodayDate(today);
    if (isEvening()) {
    setSelectedDates([new Date(today.setDate(today.getDate() + 1))]);
    } else {
      setSelectedDates([today]);
    }
  }, []);

  // Helper to format a Date as YYYY-MM-DD without timezone shifts
  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Navigate to /search with current filters
  const handleNavigateToSearch = () => {
    // Region is required
    if (!selectedRegionId) {
      alert("Please select a region")
      return
    }

    const params = new URLSearchParams();
    if (selectedDates && selectedDates.length > 0) {
      params.set('dates', selectedDates.map(formatDateLocal).join(','));
    }
    if (numOfPlayers && numOfPlayers !== "any") params.set('players', numOfPlayers);
    if (holes && holes !== "any") params.set('holes', holes);
    if (timeRange && timeRange.length === 2) {
      params.set('timeRange', `${timeRange[0]}-${timeRange[1]}`);
    }
    if (selectedRegionId) params.set('region', selectedRegionId);
    if (selectedCities.length > 0) params.set('cities', selectedCities.join(','));
    if (selectedCourses.length > 0) params.set('courses', selectedCourses.join(','));
    // Trigger auto search on destination page
    params.set('auto', '1');

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen lg:min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-slate-100 lg:p-0 font-[family-name:var(--font-geist-sans)] w-full max-w-full overflow-x-hidden lg:overflow-y-hidden">
      <main className="w-full max-w-full flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] lg:min-h-[calc(100vh-64px)] lg:gap-0 overflow-x-hidden">
        {/* Mobile Hero Section - Only visible on mobile */}
        <div className="relative w-full lg:hidden flex-shrink-0 px-[10px]" style={{ height: 'calc(100svh - 64px)' }}>
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <img src="/bg1.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-90" style={{ objectPosition: 'center 30%' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-4 -mt-16">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-white/90 text-sm font-medium tracking-wide">Live Tee Times</span>
                </div>
                <h1 className="text-white text-3xl sm:text-4xl font-bold tracking-tight drop-shadow-lg leading-tight">
                  One Search.<br />Every Course.
                </h1>
                <p className="text-white/85 text-base sm:text-lg drop-shadow leading-relaxed">
                  Compare real-time tee times across all local golf courses in seconds — no more checking each site individually.
                </p>
              </div>
            </div>
            {/* Flashing Double Arrow - Fixed at bottom of viewport */}
            <button
              onClick={scrollToSidebar}
              className="absolute left-1/2 -translate-x-1/2 bottom-6 flex flex-col items-center gap-0 cursor-pointer animate-pulse-slow z-20"
              aria-label="Scroll to filters"
            >
              <ChevronDown className="w-10 h-10 text-white drop-shadow-lg -mb-4" strokeWidth={2.5} />
              <ChevronDown className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Sidebar / Filters Section */}
        <div ref={sidebarRef} className="w-full lg:w-auto p-4 sm:p-10 lg:p-0">
          {isInitialized && (
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
              onGetTeeTimes={handleNavigateToSearch}
              isClient={isClient}
              todayDate={todayDate}
              setCourseCityMapping={setCourseCityMapping}
              selectedRegionId={selectedRegionId}
              setSelectedRegionId={setSelectedRegionId}
              hideSubmitButton={false}
            />
          )}
        </div>

        {/* Desktop Hero Section - Only visible on desktop */}
        <div className="relative flex-1 lg:h-[calc(100vh-64px)] overflow-hidden hidden lg:block">
          <img src="/bg1.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/30" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20 shadow-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-white/90 text-sm font-medium tracking-wide uppercase">Live Tee Times</span>
              </div>
              <h1 className="text-white text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight drop-shadow-lg leading-tight">
                One Search.<br />Every Course.
              </h1>
              <p className="text-white/85 text-lg md:text-xl xl:text-2xl drop-shadow leading-relaxed max-w-xl mx-auto">
                Compare real-time tee times across all local golf courses in seconds — no more checking each site individually.
              </p>
              <div className="flex items-center justify-center gap-6 pt-2 text-white/70 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Always Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Real-Time Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Multiple Courses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
