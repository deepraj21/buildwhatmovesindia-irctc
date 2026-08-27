const { randomUUID } = require("node:crypto");
const Booking = require("../models/Booking");
const { connectDatabase } = require("../config/database");

const bookings = new Map();

function makeMemoryBooking(record) {
  return Object.assign(record, {
    save: async function save() {
      bookings.set(this.id, this);
      return this;
    },
  });
}

async function createBooking(search, itinerary) {
  const id = randomUUID();
  const payload = {
    id,
    status: "DRAFT",
    search,
    itinerary,
    passengers: [],
    seatSelections: [],
    createdAt: new Date().toISOString(),
  };

  const connection = await connectDatabase();
  if (connection) {
    try {
      const record = await Booking.create(payload);
      return record.toObject();
    } catch (error) {
      console.warn("Mongo booking create failed; using in-memory fallback.", error.message);
    }
  }

  const memoryBooking = makeMemoryBooking({ ...payload });
  bookings.set(id, memoryBooking);
  return memoryBooking;
}

async function findBooking(id) {
  const connection = await connectDatabase();

  if (connection) {
    try {
      const record = await Booking.findOne({ id }).lean();
      if (record) return Object.assign(record, { save: async function save() { return this; } });
    } catch (error) {
      console.warn("Mongo booking lookup failed; using in-memory fallback.", error.message);
    }
  }

  const memoryBooking = bookings.get(id);
  if (memoryBooking) return memoryBooking;
  return null;
}

module.exports = { createBooking, findBooking };
