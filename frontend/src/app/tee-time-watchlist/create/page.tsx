"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WatchlistFilters from "@/components/WatchlistFilters";
import { toast } from "sonner";
import { createTeeTimeWatchlist, type TeeTimeWatchlistFilters } from "@/services/teeTimeWatchlistService";
import { fetchTeeTimes } from "@/services/teeTimeService";
import { fetchCourseDisplayNamesAndTheirCities } from "@/services/supabaseService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function CreateTeeTimeWatchlistPage() {
  const router = useRouter();
  const [selectedDates, setSelectedDates] = useState<Date[] | undefined>(undefined);
  const [numOfPlayers, setNumOfPlayers] = useState<string>("any");
  const [holes, setHoles] = useState<string>("any");
  const [timeRange, setTimeRange] = useState<number[]>([7, 17]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [todayDate, setTodayDate] = useState<Date | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [courseCityMapping, setCourseCityMapping] = useState<Record<string, string>>({});
  const [courseIdMapping, setCourseIdMapping] = useState<Record<string, number>>({});

  // Dialog state for when tee times are available
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [pendingSearchParams, setPendingSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setIsClient(true);
    setTodayDate(new Date());
  }, []);

  useEffect(() => {
    try {
      const savedRegionId = typeof window !== 'undefined' ? localStorage.getItem('selectedRegionId') : null;
      if (savedRegionId) {
        setSelectedRegionId(savedRegionId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedRegionId) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedRegionId', selectedRegionId);
      }
    } catch {}
  }, [selectedRegionId]);

  const formatDateLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const createWatchlistNow = async () => {
    setLoading(true);
    try {
      // Ensure course mappings are available when needed
      if ((selectedCourses.length > 0 || selectedCities.length > 0) && (Object.keys(courseIdMapping).length === 0 || Object.keys(courseCityMapping).length === 0) && selectedRegionId) {
        const courseCityData = await fetchCourseDisplayNamesAndTheirCities(selectedRegionId);
        const idMapping: Record<string, number> = {};
        const simpleCityMapping: Record<string, string> = {};
        Object.entries(courseCityData).forEach(([courseName, courseData]) => {
          const data = courseData as { courseId: number; city: string };
          idMapping[courseName] = data.courseId;
          simpleCityMapping[courseName] = data.city;
        });
        setCourseIdMapping(idMapping);
        setCourseCityMapping(simpleCityMapping);
      }
      // Build filters payload
      const startHour = timeRange[0];
      const endHour = timeRange[1];
      const date = selectedDates?.[0]
        ? formatDateLocal(new Date(selectedDates[0]))
        : formatDateLocal(new Date());

      const allCourses = Object.entries(courseIdMapping)
        .map(([name, id]) => ({ id, name }))
        .filter((c) => typeof c.id === 'number' && !Number.isNaN(c.id));

      const resolvedCourses =
        selectedCourses.length === 0
          ? allCourses
          : selectedCourses
              .map((courseName) => {
                const id = courseIdMapping[courseName];
                return typeof id === 'number' && !Number.isNaN(id)
                  ? { id, name: courseName }
                  : null;
              })
              .filter((c): c is { id: number; name: string } => c !== null);

      const filters: TeeTimeWatchlistFilters = {
        date,
        start_hour: startHour,
        end_hour: endHour,
        num_of_players: numOfPlayers,
        holes,
        regionId: selectedRegionId,
        courses: resolvedCourses,
      };
      console.log(filters);
      const created = await createTeeTimeWatchlist(filters);
      toast.success("Watchlist created", {
        description: `Saved preferences for ${created?.region ?? 'region'} on ${filters.date}`,
      });
      router.push("/tee-time-watchlist");
    } catch (error) {
      console.error('Failed to create watchlist:', error);
      toast.error("Failed to create watchlist");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate minimal inputs
    if (!selectedDates || selectedDates.length === 0) return;
    if (!selectedRegionId) {
      toast.error("Please select a region");
      return;
    }

    setLoading(true);
    try {
      // Ensure course mappings are available when needed
      if ((selectedCourses.length > 0 || selectedCities.length > 0) && (Object.keys(courseIdMapping).length === 0 || Object.keys(courseCityMapping).length === 0) && selectedRegionId) {
        const courseCityData = await fetchCourseDisplayNamesAndTheirCities(selectedRegionId);
        const idMapping: Record<string, number> = {};
        const simpleCityMapping: Record<string, string> = {};
        Object.entries(courseCityData).forEach(([courseName, courseData]) => {
          const data = courseData as { courseId: number; city: string };
          idMapping[courseName] = data.courseId;
          simpleCityMapping[courseName] = data.city;
        });
        setCourseIdMapping(idMapping);
        setCourseCityMapping(simpleCityMapping);
      }
      const dateStr = formatDateLocal(new Date(selectedDates[0]));
      const startTime = timeRange[0];
      const endTime = timeRange[1];

      // Build optional courseIds from selected courses and/or cities
      const nameToId: Record<string, string> = {};
      Object.entries(courseIdMapping).forEach(([name, id]) => {
        if (typeof id === 'number' && !Number.isNaN(id)) nameToId[name] = String(id);
      });
      let courseIds: string[] | undefined = undefined;
      const idsSet = new Set<string>();
      if (selectedCourses.length > 0) {
        // Honor explicit course selections only
        selectedCourses.forEach((courseName) => {
          const id = nameToId[courseName];
          if (id) idsSet.add(id);
        });
      } else if (selectedCities.length > 0 && courseCityMapping && Object.keys(courseCityMapping).length > 0) {
        // Only fall back to city-based inclusion if no explicit courses were selected
        Object.entries(courseCityMapping).forEach(([courseName, cityName]) => {
          if (selectedCities.includes(cityName)) {
            const id = nameToId[courseName];
            if (id) idsSet.add(id);
          }
        });
      }
      if (idsSet.size > 0) courseIds = Array.from(idsSet);

      const data = await fetchTeeTimes({
        dates: [dateStr],
        numOfPlayers,
        holes,
        regionId: selectedRegionId,
        startTime,
        endTime,
        courseIds,
      });

      if (data && data.length > 0) {
        setAvailableCount(data.length);
        const params = new URLSearchParams();
        params.set('dates', dateStr);
        params.set('players', numOfPlayers);
        params.set('holes', holes);
        params.set('timeRange', `${timeRange[0]}-${timeRange[1]}`);
        params.set('region', selectedRegionId);
        if (courseIds && courseIds.length > 0) {
          params.set('courseIds', courseIds.join(','));
        } else {
          if (selectedCourses.length > 0) params.set('courses', selectedCourses.join(','));
          if (selectedCities.length > 0) params.set('cities', selectedCities.join(','));
        }
        setPendingSearchParams(params);
        setShowResultsDialog(true);
        return;
      }

      // No results – create watchlist as before
      await createWatchlistNow();
    } catch (error) {
      console.error('Failed during availability check:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 lg:min-h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/tee-time-watchlist">Current Watchlists</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create Watchlist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <WatchlistFilters
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
          loading={loading}
          onGetTeeTimes={handleSubmit}
          isClient={isClient}
          todayDate={todayDate}
          setCourseCityMapping={setCourseCityMapping}
          setCourseIdMapping={setCourseIdMapping}
          selectedRegionId={selectedRegionId}
          setSelectedRegionId={setSelectedRegionId}
          calendarExpandedClassName="p-2 max-w-[18rem] mx-auto"
        />

        {/* Availability Dialog */}
        <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>We found tee times!</DialogTitle>
              <DialogDescription>
                There are currently <strong>{availableCount}</strong> tee times available for your watchlist parameters.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResultsDialog(false);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const qs = pendingSearchParams?.toString();
                  setShowResultsDialog(false);
                  if (qs) {
                    const url = `/search?${qs}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                Show me <SquareArrowOutUpRight className="inline-block" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

