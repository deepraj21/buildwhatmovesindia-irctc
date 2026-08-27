const express = require("express");
const mongoose = require("mongoose");
const Station = require("../models/Station");
const { analyseJourney } = require("../services/journeyService");
const { createBooking, findBooking, toClient } = require("../store/bookingStore");
const { stations } = require("../data/trains");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

router.get("/stations", async (req, res, next) => {
  try {
    const query = String(req.query.q || "").toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const filter = query ? {
        $or: [
          { code: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
          { city: { $regex: query, $options: "i" } },
          { aliases: { $regex: query, $options: "i" } },
        ],
      } : {};
      const data = await Station.find(filter).sort({ code: 1 }).select("-createdAt -updatedAt").lean();
      return res.json({ data });
    }

    const filtered = stations.filter((station) => !query || `${station.code} ${station.name} ${station.city} ${station.aliases || ""}`.toLowerCase().includes(query));
    return res.json({ data: filtered });
  } catch (error) { next(error); }
});

router.post("/journeys/analyse", async (req, res, next) => {
  try { res.json(await analyseJourney(req.body)); } catch (error) { next(error); }
});

router.post("/bookings", async (req, res, next) => {
  try {
    const { search, itinerary } = req.body;
    if (!search || !itinerary?.legs?.length) return res.status(422).json({ error: "search and a selected itinerary are required." });
    res.status(201).json({ data: toClient(await createBooking(search, itinerary)) });
  } catch (error) { next(error); }
});

router.get("/bookings/:bookingId", async (req, res, next) => {
  try {
    const booking = await findBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    res.json({ data: toClient(booking) });
  } catch (error) { next(error); }
});

router.put("/bookings/:bookingId/passengers", async (req, res, next) => {
  try {
    const booking = await findBooking(req.params.bookingId);
    const passengers = req.body.passengers;
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (!Array.isArray(passengers) || !passengers.length || passengers.length > 6 || passengers.some((p) => !p.name || !p.age || !p.gender)) return res.status(422).json({ error: "Each passenger needs name, age, and gender. You can add up to 6 travellers." });
    booking.passengers = passengers.map((p, index) => ({ id: p.id || `P${index + 1}`, name: String(p.name).trim(), age: Number(p.age), gender: p.gender, preference: p.preference || "NO_PREFERENCE" }));
    booking.search = { ...(booking.search?.toObject?.() || booking.search), passengers: booking.passengers.length };
    if (typeof booking.markModified === "function") {
      booking.markModified("passengers");
      booking.markModified("search");
    }
    if (typeof booking.save === "function") await booking.save();
    res.json({ data: toClient(booking) });
  } catch (error) { next(error); }
});

router.put("/bookings/:bookingId/seats", async (req, res, next) => {
  try {
    const booking = await findBooking(req.params.bookingId);
    const selections = req.body.selections;
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (!booking.passengers.length) return res.status(409).json({ error: "Passenger details must be saved before selecting seats." });
    if (!Array.isArray(selections) || selections.length !== booking.itinerary.legs.length) return res.status(422).json({ error: "Select one class for every journey leg." });
    const travellerCount = booking.passengers.length;
    const invalidSelection = selections.some((selection, index) => {
      const leg = booking.itinerary.legs[index];
      const selectedClass = leg.classes.find((travelClass) => travelClass.code === selection?.classCode);
      const seatNumbers = selectedSeats(selection);
      const uniqueSeats = new Set(seatNumbers);
      return !selection?.trainId
        || !selection.classCode
        || selection.trainId !== leg.trainId
        || !selectedClass
        || uniqueSeats.size !== travellerCount
        || seatNumbers.some((seatNumber) => !selectedClass.seats?.some((seat) => seat.number === seatNumber && seat.available));
    });
    if (invalidSelection) return res.status(422).json({ error: "Each selection must match its journey leg, class, and one available seat per passenger." });
    booking.seatSelections = selections.map((selection) => {
      const seatNumbers = selectedSeats(selection);
      return { ...selection, seatNumbers, seatNumber: seatNumbers[0], holdId: randomHold(), heldUntil: new Date(Date.now() + 8 * 60_000).toISOString() };
    });
    booking.status = "SEATS_HELD";
    if (typeof booking.markModified === "function") booking.markModified("seatSelections");
    if (typeof booking.save === "function") await booking.save();
    res.json({ data: toClient(booking) });
  } catch (error) { next(error); }
});

router.post("/bookings/:bookingId/payment", async (req, res, next) => {
  try {
    const booking = await findBooking(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (!booking.passengers.length || !booking.seatSelections.length) return res.status(409).json({ error: "Passenger details and seat selections must be completed first." });
    booking.status = "CONFIRMED";
    booking.payment = { paymentId: `pay_${Date.now()}`, status: "SUCCESS", method: req.body.method || "UPI", paidAt: new Date().toISOString() };
    booking.pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
    if (typeof booking.markModified === "function") booking.markModified("payment");
    if (typeof booking.save === "function") await booking.save();
    res.json({ data: toClient(booking) });
  } catch (error) { next(error); }
});

function selectedSeats(selection) {
  if (Array.isArray(selection?.seatNumbers) && selection.seatNumbers.length) {
    return selection.seatNumbers.map(String);
  }
  return selection?.seatNumber ? [String(selection.seatNumber)] : [];
}

function randomHold() { return `hold_${Math.random().toString(36).slice(2, 10)}`; }

module.exports = router;
