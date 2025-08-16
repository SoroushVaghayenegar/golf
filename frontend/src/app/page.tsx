"use client";
import posthog from 'posthog-js';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getVancouverToday, 
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
  // State for filters
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [numOfPlayers, setNumOfPlayers] = useState<string>("any");
  const [holes, setHoles] = useState<string>("any");
  const [timeRange, setTimeRange] = useState<number[]>([5, 22]); // 5am to 10pm
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [removedCourseIds] = useState<number[]>([]);
  const {selectedRegionId, setSelectedRegionId, isInitialized } = useRegionIdWithStorage();
  const [loading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [, setCourseCityMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);

    // Initialize dates after hydration
    const today = getVancouverToday();
    setTodayDate(today);
    setSelectedDates([today]);
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
    if (selectedCities.length > 0) params.set('cities', selectedCities.join(','));
    if (selectedCourses.length > 0) params.set('courses', selectedCourses.join(','));
    // Trigger auto search on destination page
    params.set('auto', '1');

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen lg:min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 to-slate-100 p-4 py-0 sm:p-10 lg:p-0 font-[family-name:var(--font-geist-sans)] w-full max-w-full overflow-x-hidden lg:overflow-y-hidden">
      <main className="w-full max-w-full flex flex-col lg:flex-row lg:h-[calc(100vh-64px)] lg:min-h-[calc(100vh-64px)] gap-8 lg:gap-0 overflow-x-hidden">
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
        <div className="relative flex-1 lg:h-[calc(100vh-64px)] h-[50vh] overflow-hidden hidden lg:block">
          <img src="/bg1.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 w-full h-full flex items-center justify-center p-6 text-center">
            <div className="max-w-3xl">
              <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold drop-shadow-md">
                Click &quot;Get Tee Times&quot; to find your ideal tee time
              </h1>
              <p className="mt-3 text-white/90 text-base sm:text-lg md:text-xl drop-shadow">
                Select your preferences and discover available tee times
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
