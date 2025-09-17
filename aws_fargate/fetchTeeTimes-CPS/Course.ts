export class Course {
  id: number;
  name: string;
  display_name: string;
  club_name: string;
  city: string;
  rating: number;
  external_api: string;
  external_api_attributes: Record<string, any>;
  booking_visibility_days: number;
  requires_login: boolean;
  booking_visibility_start_time: string;
  timezone: string;

  constructor(
    id: number,
    name: string,
    display_name: string,
    club_name: string,
    city: string,
    rating: number,
    external_api: string,
    external_api_attributes: Record<string, any> = {},
    booking_visibility_days: number = 0,
    requires_login: boolean = false,
    booking_visibility_start_time: string = "",
    timezone: string = ""
  ) {
    this.id = id;
    this.name = name;
    this.display_name = display_name;
    this.club_name = club_name;
    this.city = city;
    this.rating = rating;
    this.external_api = external_api;
    this.external_api_attributes = external_api_attributes;
    this.booking_visibility_days = booking_visibility_days;
    this.requires_login = requires_login;
    this.booking_visibility_start_time = booking_visibility_start_time;
    this.timezone = timezone;
  }

  // Helper method to create a Course from a plain object
  static fromObject(obj: any): Course {
    // Handle nested city data from join
    const cityName = obj.cities?.name;
    
    return new Course(
      obj.id,
      obj.name,
      obj.display_name,
      obj.club_name,
      cityName,
      obj.rating,
      obj.external_api,
      obj.external_api_attributes || {},
      obj.booking_visibility_days || 0,
      obj.requires_login || false,
      obj.booking_visibility_start_time || "",
      obj.timezone || ""
    );
  }

  // Helper method to convert Course to a plain object
  toObject(): any {
    return {
      id: this.id,
      name: this.name,
      display_name: this.display_name,
      club_name: this.club_name,
      city: this.city,
      rating: this.rating,
      external_api: this.external_api,
      external_api_attributes: this.external_api_attributes,
      booking_visibility_days: this.booking_visibility_days,
      requires_login: this.requires_login,
      booking_visibility_start_time: this.booking_visibility_start_time,
      timezone: this.timezone
    };
  }
} 