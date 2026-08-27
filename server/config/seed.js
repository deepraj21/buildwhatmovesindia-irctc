const mongoose = require("mongoose");
const { Station, Train, Booking } = require("../models");
const { stations: staticStations, trains: staticTrains } = require("../data/trains");

function buildSeedPayload() {
  return {
    stations: staticStations.map((station) => ({
      code: station.code,
      name: station.name,
      city: station.city,
      aliases: station.aliases || [],
    })),
    trains: staticTrains.map((train) => ({
      id: train.id,
      name: train.name,
      from: train.from,
      to: train.to,
      departure: train.departure,
      arrival: train.arrival,
      arrivalDayOffset: train.arrivalDayOffset,
      durationMinutes: train.durationMinutes,
      punctuality: {
        averageDelayMinutes: train.punctuality.averageDelayMinutes,
        p90DelayMinutes: train.punctuality.p90DelayMinutes,
      },
      classes: train.classes.map((item) => ({
        code: item.code,
        name: item.name,
        fare: item.fare,
        available: item.available,
      })),
    })),
    bookings: [
      {
        id: "seed-booking-001",
        status: "DRAFT",
        search: { from: "HWH", to: "MYS", date: "2026-09-15", passengers: 2 },
        itinerary: { kind: "direct", legs: [] },
        passengers: [],
        seatSelections: [],
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

async function seedDatabase() {
  if (mongoose.connection.readyState !== 1) return false;

  const { stations, trains, bookings } = buildSeedPayload();

  const stationCount = await Station.countDocuments();
  if (stationCount === 0) await Station.insertMany(stations);

  const trainCount = await Train.countDocuments();
  if (trainCount === 0) await Train.insertMany(trains);

  const bookingCount = await Booking.countDocuments();
  if (bookingCount === 0) await Booking.insertMany(bookings);

  return true;
}

module.exports = { buildSeedPayload, seedDatabase };
