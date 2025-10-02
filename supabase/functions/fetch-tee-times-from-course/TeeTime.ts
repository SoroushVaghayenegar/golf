export class TeeTime {
  start_datetime: Date;
  players_available: number;
  available_participants: number[];available_participants: number[];
  holes: number;
  price: number;
  booking_link: string;
  tee_time_id: string;
  starting_tee: number;

  constructor(
    start_datetime: Date,
    players_available: number,
    available_participants: number[],
    holes: number,
    price: number,
    booking_link: string,
    tee_time_id: string,
    starting_tee: number,
  ) {
    this.start_datetime = start_datetime;
    this.players_available = players_available;
    this.available_participants = available_participants;
    this.holes = holes;
    this.price = price;
    this.booking_link = booking_link;
    this.tee_time_id = tee_time_id;
    this.starting_tee = starting_tee;
  }

  // Helper method to create a TeeTime from a plain object
  static fromObject(obj: any): TeeTime {
    return new TeeTime(
      obj.start_datetime,
      obj.players_available,
      obj.available_participants,
      obj.holes,
      obj.price,
      obj.booking_link,
      obj.tee_time_id,
      obj.starting_tee
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
      booking_link: this.booking_link,
      tee_time_id: this.tee_time_id,
      starting_tee: this.starting_tee
    };
  }
} 