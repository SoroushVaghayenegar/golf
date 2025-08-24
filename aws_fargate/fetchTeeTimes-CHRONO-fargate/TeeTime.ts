export class TeeTime {
  start_datetime: string;
  players_available: number;
  holes: number;
  price: number;
  booking_link: string;
  tee_time_id: string;

  constructor(
    start_datetime: string,
    players_available: number,
    holes: number,
    price: number,
    booking_link: string,
    tee_time_id: string
  ) {
    this.start_datetime = start_datetime;
    this.players_available = players_available;
    this.holes = holes;
    this.price = price;
    this.booking_link = booking_link;
    this.tee_time_id = tee_time_id;
  }

  // Helper method to create a TeeTime from a plain object
  static fromObject(obj: any): TeeTime {
    return new TeeTime(
      obj.start_datetime,
      obj.players_available,
      obj.holes,
      obj.price,
      obj.booking_link,
      obj.tee_time_id
    );
  }

  // Helper method to convert TeeTime to a plain object
  toObject(): any {
    return {
      start_datetime: this.start_datetime,
      players_available: this.players_available,
      holes: this.holes,
      price: this.price,
      booking_link: this.booking_link,
      tee_time_id: this.tee_time_id
    };
  }
} 