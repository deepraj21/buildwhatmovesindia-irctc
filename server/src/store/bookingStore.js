const { randomUUID } = require("node:crypto");
const bookings = new Map();

function createBooking(search, itinerary) {
  const id = randomUUID();
  const booking = { id, status: "DRAFT", search, itinerary, passengers: [], seatSelections: [], createdAt: new Date().toISOString() };
  bookings.set(id, booking);
  return booking;
}
const findBooking = (id) => bookings.get(id);
module.exports = { createBooking, findBooking };
