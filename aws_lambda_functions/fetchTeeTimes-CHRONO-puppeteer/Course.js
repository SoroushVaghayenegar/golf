"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Course = void 0;
class Course {
    constructor(id, name, display_name, club_name, city, rating, external_api, external_api_attributes = {}, booking_visibility_days = 0, booking_visibility_start_time, timezone) {
        this.id = id;
        this.name = name;
        this.display_name = display_name;
        this.club_name = club_name;
        this.city = city;
        this.rating = rating;
        this.external_api = external_api;
        this.external_api_attributes = external_api_attributes;
        this.booking_visibility_days = booking_visibility_days;
        this.booking_visibility_start_time = booking_visibility_start_time;
        this.timezone = timezone;
    }
    // Helper method to create a Course from a plain object
    static fromObject(obj) {
        // Handle nested city data from join
        const cityName = obj.cities?.name;
        return new Course(obj.id, obj.name, obj.display_name, obj.club_name, cityName, obj.rating, obj.external_api, obj.external_api_attributes || {}, obj.booking_visibility_days || 0, obj.booking_visibility_start_time, obj.timezone);
    }
    // Helper method to convert Course to a plain object
    toObject() {
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
            booking_visibility_start_time: this.booking_visibility_start_time,
            timezone: this.timezone
        };
    }
}
exports.Course = Course;
