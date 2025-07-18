"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.City = void 0;
class City {
    constructor(id, name, longitude, latitude) {
        this.id = id;
        this.name = name;
        this.longitude = longitude;
        this.latitude = latitude;
    }
    // Helper method to create a City from a plain object
    static fromObject(obj) {
        // Handle nested city data from join
        const cityName = obj.cities?.name;
        return new City(obj.id, obj.name, obj.longitude, obj.latitude);
    }
    // Helper method to convert City to a plain object
    toObject() {
        return {
            id: this.id,
            name: this.name,
            longitude: this.longitude,
            latitude: this.latitude
        };
    }
}
exports.City = City;
