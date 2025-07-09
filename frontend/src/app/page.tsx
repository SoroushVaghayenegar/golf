"use client";
import { useState, useEffect, useRef } from "react";
import { fetchTeeTimes, type TeeTime } from "../services/teeTimeService";
import { 
  getVancouverToday, 
  formatDateForAPI
} from "../services/timezoneService";
import TeeTimeCards, { TeeTimeCardsRef } from "@/components/TeeTimeCards";
import Sidebar from "@/components/Sidebar";
import FeatureRequest from "@/components/FeatureRequest";

export default function Home() {
  // State for filters
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [fetchedDates, setFetchedDates] = useState<Date[] | undefined>(undefined);
  const [numOfPlayers, setNumOfPlayers] = useState<number>(4);
  const [holes, setHoles] = useState(18);
  const [timeRange, setTimeRange] = useState<number[]>([5, 22]); // 5am to 10pm
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [removedCourses, setRemovedCourses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'startTime' | 'priceAsc' | 'priceDesc' | 'rating'>('startTime');
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseCityMapping, setCourseCityMapping] = useState<Record<string, string>>({});
  
  // Subscription component state
  const [showSubscription, setShowSubscription] = useState(false);
  const [subscriptionShown, setSubscriptionShown] = useState(false);
  const [subscriptionDismissed, setSubscriptionDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [visibleTeeTimeCount, setVisibleTeeTimeCount] = useState(0);
  const resultsSectionRef = useRef<TeeTimeCardsRef>(null);

  // Check sessionStorage and set mobile state on component mount
  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    const dismissed = sessionStorage.getItem('subscription-dismissed') === 'true';
    setSubscriptionDismissed(dismissed);
    
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

  // Tee time count-based subscription trigger
  useEffect(() => {
    if (!teeTimes.length || subscriptionShown || subscriptionDismissed) return;

    const mobileThreshold = 5;
    const desktopThreshold = 15;
    const threshold = isMobile ? mobileThreshold : desktopThreshold;

    if (visibleTeeTimeCount >= threshold) {
      setShowSubscription(true);
      setSubscriptionShown(true);
    }
  }, [visibleTeeTimeCount, teeTimes.length, subscriptionShown, subscriptionDismissed, isMobile]);

  // Reset subscription state when new search is performed
  useEffect(() => {
    setShowSubscription(false);
    setSubscriptionShown(false);
    setVisibleTeeTimeCount(0);
  }, [fetchedDates]);

  // Handle subscription dismissal
  const handleSubscriptionDismiss = () => {
    setSubscriptionDismissed(true);
    setShowSubscription(false);
    setSubscriptionShown(true);
  };

  // Handle removing a course from filters
  const handleRemoveCourse = (courseName: string) => {
    setRemovedCourses(prev => [...prev, courseName]);
    setSelectedCourses(prev => prev.filter(course => course !== courseName));
  };

  // Function to fetch tee times
  const handleGetTeeTimes = async () => {
    if (!selectedDates || selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    
    setLoading(true);
    setError(null);
    setRemovedCourses([]); // Clear removed courses when starting a new search
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4 sm:p-10 lg:p-0 font-[family-name:var(--font-geist-sans)]">
      <main className="w-full flex flex-col lg:flex-row lg:h-screen gap-8 lg:gap-0">
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
          removedCourses={removedCourses}
          loading={loading}
          onGetTeeTimes={handleGetTeeTimes}
          isClient={isClient}
          todayDate={todayDate}
          setCourseCityMapping={setCourseCityMapping}
        />

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
              removedCourses={removedCourses}
              onRemoveCourse={handleRemoveCourse}
              fetchedDates={fetchedDates}
              sortBy={sortBy}
              setSortBy={setSortBy}
              showSubscription={showSubscription}
              setShowSubscription={setShowSubscription}
              handleSubscriptionDismiss={handleSubscriptionDismiss}
              isMobile={isMobile}
              hasSearched={teeTimes.length > 0 || loading || !!error}
              courseCityMapping={courseCityMapping}
              onTeeTimeVisibilityChange={setVisibleTeeTimeCount}
            />
          </div>
        )}
      </main>
      
      {/* Feature Request Component */}
      <FeatureRequest />
    </div>
  );
}
