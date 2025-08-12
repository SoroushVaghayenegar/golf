"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WatchlistFilters from "@/components/WatchlistFilters";
import { toast } from "sonner";
import { createTeeTimeWatchlist, type TeeTimeWatchlistFilters } from "@/services/teeTimeWatchlistService";
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
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [, setCourseCityMapping] = useState<Record<string, string>>({});
  const [courseIdMapping, setCourseIdMapping] = useState<Record<string, number>>({});

  useEffect(() => {
    setIsClient(true);
    setTodayDate(new Date());
  }, []);

  useEffect(() => {
    try {
      const savedRegion = typeof window !== 'undefined' ? localStorage.getItem('selectedRegion') : null;
      if (savedRegion) {
        setSelectedRegion(savedRegion);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedRegion', selectedRegion);
      }
    } catch {}
  }, [selectedRegion]);

  const handleCreateWatchlist = async () => {
    setLoading(true);
    try {
      // Build filters payload
      const startHour = timeRange[0];
      const endHour = timeRange[1];
      const start_time = `${String(startHour).padStart(2, '0')}:00`;
      const end_time = `${String(endHour).padStart(2, '0')}:00`;
      const date = selectedDates?.[0]
        ? new Date(selectedDates[0]).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

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
        start_time,
        end_time,
        num_of_players: numOfPlayers,
        holes,
        region: selectedRegion,
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
          onGetTeeTimes={handleCreateWatchlist}
          isClient={isClient}
          todayDate={todayDate}
          setCourseCityMapping={setCourseCityMapping}
          setCourseIdMapping={setCourseIdMapping}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          calendarExpandedClassName="p-2 max-w-[18rem] mx-auto"
        />
      </div>
    </div>
  );
}

