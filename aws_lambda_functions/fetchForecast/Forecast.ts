export class Forecast {
    city_id: number;
    date: string;
    temperature_2m: any;
    wind_speed_10m: any;
    wind_gusts_10m: any;
    weather_code: any;
    precipitation_probability: any;
    cloud_cover: any;
    uv_index: any;
    precipitation: any;
  
    constructor(
      city_id: number,
      date: string,
      temperature_2m: any,
      wind_speed_10m: any,
      wind_gusts_10m: any,
      weather_code: any,
      precipitation_probability: any,
      cloud_cover: any,
      uv_index: any,
      precipitation: any
    ) {
      this.city_id = city_id;
      this.date = date;
      this.temperature_2m = temperature_2m;
      this.wind_speed_10m = wind_speed_10m;
      this.wind_gusts_10m = wind_gusts_10m;
      this.weather_code = weather_code;
      this.precipitation_probability = precipitation_probability;
      this.cloud_cover = cloud_cover;
      this.uv_index = uv_index;
      this.precipitation = precipitation;
    }
  
    // Helper method to create a City from a plain object
    static fromObject(obj: any): City {
      // Handle nested city data from join
      const cityName = obj.cities?.name;
      
      return new City(
        obj.city_id,
        obj.date,
        obj.temperature_2m,
        obj.wind_speed_10m,
        obj.wind_gusts_10m,
        obj.weather_code,
        obj.precipitation_probability,
        obj.cloud_cover,
        obj.uv_index,
        obj.precipitation
      );
    }
  
    // Helper method to convert City to a plain object
    toObject(): any {
      return {
        city_id: this.city_id,
        date: this.date,
        temperature_2m: this.temperature_2m,
        wind_speed_10m: this.wind_speed_10m,
        wind_gusts_10m: this.wind_gusts_10m,
        weather_code: this.weather_code,
        precipitation_probability: this.precipitation_probability,
        cloud_cover: this.cloud_cover,
        uv_index: this.uv_index,
        precipitation: this.precipitation
      };
    }
  } 