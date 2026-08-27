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
      const record = await Booking.findOne({ id });
      if (record) return record;
    } catch (error) {
      console.warn("Mongo booking lookup failed; using in-memory fallback.", error.message);
    }
  }

  return bookings.get(id) || null;
}

function toClient(booking) {
  if (!booking) return booking;
  const data = typeof booking.toJSON === "function" ? booking.toJSON() : { ...booking };
  delete data.save;
  delete data._id;
  data.passengers = Array.isArray(data.passengers) ? data.passengers : [];
  data.seatSelections = Array.isArray(data.seatSelections) ? data.seatSelections : [];
  return data;
}

module.exports = { createBooking, findBooking, toClient };
