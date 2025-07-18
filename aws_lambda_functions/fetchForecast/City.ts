export class City {
  id: number;
  name: string;
  longitude: number;
  latitude: number;

  constructor(
    id: number,
    name: string,
    longitude: number,
    latitude: number
  ) {
    this.id = id;
    this.name = name;
    this.longitude = longitude;
    this.latitude = latitude;
  }

  // Helper method to create a City from a plain object
  static fromObject(obj: any): City {
    // Handle nested city data from join
    const cityName = obj.cities?.name;
    
    return new City(
      obj.id,
      obj.name,
      obj.longitude,
      obj.latitude
    );
  }

  // Helper method to convert City to a plain object
  toObject(): any {
    return {
      id: this.id,
      name: this.name,
      longitude: this.longitude,
      latitude: this.latitude
    };
  }
} 