// Re-export TeeTime and CourseInfo from teeTimeService for consistency
export type { TeeTime, CourseInfo } from "@/services/teeTimeService";

// Course from Supabase - matches the courses table structure
export interface Course {
  id: number;
  name: string;
  display_name: string;
  club_name: string;
  rating: number;
  city_id: number;
  external_api: "CPS" | "CHRONO_LIGHTSPEED";
  external_api_attributes: CPSAttributes | ChronoAttributes;
  booking_visibility_days: number;
  requires_login: boolean;
  booking_visibility_start_time: string | null;
  timezone: string;
  latitude: number;
  longitude: number;
  address: string;
  phone_number: string;
  slug: string;
  cities: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface CPSAttributes {
  subdomain: string;
  params: Record<string, string | number>;
  headers: Record<string, string>;
  needsTransactionId?: boolean;
}

export interface ChronoAttributes {
  club_id: number;
  course_id: number;
  affiliation_type_id: number;
  club_link_name: string;
  course_holes: number[];
}

// Raw API response types for Chrono
export interface ChronoApiTeeTime {
  id: number;
  date: string;
  start_time: string;
  out_of_capacity: boolean;
  restrictions?: unknown[];
  green_fees: Array<{ green_fee?: number }>;
}

// Raw API response types for CPS
export interface CPSShItemPrice {
  shItemCode: string;
  currentPrice: number;
}

export interface CPSApiTeeTime {
  startTime: string;
  minPlayer: number;
  maxPlayer: number;
  availableParticipantNo: number[];
  shItemPrices?: CPSShItemPrice[];
  startingTee?: number;
}

// Raw tee time before transformation to final TeeTime format
export interface RawTeeTime {
  tee_time_id: string;
  start_datetime: string;
  players_available: number;
  available_participants: number[];
  holes: number;
  price: number;
  booking_link: string;
  booking_links: { [key: number]: string };
  starting_tee?: number;
}

// Forecast data from Supabase
export interface ForecastData {
  city_id: number;
  date: string;
  [key: string]: {
    data: number[];
  } | number | string;
}

// Result from fetching tee times for a course/date
export interface FetchResult {
  courseId: number;
  course: Course;
  date: string;
  teeTimes: RawTeeTime[];
  error?: string;
}

