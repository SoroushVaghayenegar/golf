export class TeeTime {
  start_datetime: Date;
  players_available: number;
  available_participants: number[];
  holes: number;
  price: number;
  booking_link: string;

  constructor(
    start_datetime: Date,
    players_available: number,
    available_participants: number[],
    holes: number,
    price: number,
    booking_link: string
  ) {
    this.start_datetime = start_datetime;
    this.players_available = players_available;
    this.available_participants = available_participants;
    this.holes = holes;
    this.price = price;
    this.booking_link = booking_link;
  }

  // Helper method to create a TeeTime from a plain object
  static fromObject(obj: any): TeeTime {
    return new TeeTime(
      obj.start_datetime,
      obj.players_available,
      obj.available_participants,
      obj.holes,
      obj.price,
      obj.booking_link
    );
  }

  // Helper method to convert TeeTime to a plain object
  toObject(): any {
    return {
      start_datetime: this.start_datetime,
      players_available: this.players_available,
      available_participants: this.available_participants,
      holes: this.holes,
      price: this.price,
      booking_link: this.booking_link
    };
  }
} 