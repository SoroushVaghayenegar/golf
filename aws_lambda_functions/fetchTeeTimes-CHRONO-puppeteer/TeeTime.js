"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeeTime = void 0;
class TeeTime {
    constructor(start_datetime, players_available, holes, price, booking_link) {
        this.start_datetime = start_datetime;
        this.players_available = players_available;
        this.holes = holes;
        this.price = price;
        this.booking_link = booking_link;
    }
    // Helper method to create a TeeTime from a plain object
    static fromObject(obj) {
        return new TeeTime(obj.start_datetime, obj.players_available, obj.holes, obj.price, obj.booking_link);
    }
    // Helper method to convert TeeTime to a plain object
    toObject() {
        return {
            start_datetime: this.start_datetime,
            players_available: this.players_available,
            holes: this.holes,
            price: this.price,
            booking_link: this.booking_link
        };
    }
}
exports.TeeTime = TeeTime;
