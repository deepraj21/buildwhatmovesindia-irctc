const express = require("express");
const { stations } = require("../data/trains");
const { analyseJourney } = require("../services/journeyService");
const { createBooking, findBooking } = require("../store/bookingStore");

const router = express.Router();
router.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
router.get("/stations", (req, res) => {
  const query = String(req.query.q || "").toLowerCase();
  res.json({ data: stations.filter((station) => !query || `${station.code} ${station.name} ${station.city}`.toLowerCase().includes(query)) });
});
router.post("/journeys/analyse", (req, res, next) => {
  try { res.json(analyseJourney(req.body)); } catch (error) { next(error); }
});
router.post("/bookings", (req, res) => {
  const { search, itinerary } = req.body;
  if (!search || !itinerary?.legs?.length) return res.status(422).json({ error: "search and a selected itinerary are required." });
  res.status(201).json({ data: createBooking(search, itinerary) });
});
router.get("/bookings/:bookingId", (req, res) => {
  const booking = findBooking(req.params.bookingId);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  res.json({ data: booking });
});
router.put("/bookings/:bookingId/passengers", (req, res) => {
  const booking = findBooking(req.params.bookingId);
  const passengers = req.body.passengers;
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (!Array.isArray(passengers) || !passengers.length || passengers.some((p) => !p.name || !p.age || !p.gender)) return res.status(422).json({ error: "Each passenger needs name, age, and gender." });
  booking.passengers = passengers.map((p, index) => ({ id: p.id || `P${index + 1}`, name: p.name, age: Number(p.age), gender: p.gender, preference: p.preference || "NO_PREFERENCE" }));
  res.json({ data: booking });
});
router.put("/bookings/:bookingId/seats", (req, res) => {
  const booking = findBooking(req.params.bookingId);
  const selections = req.body.selections;
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (!Array.isArray(selections) || selections.length !== booking.itinerary.legs.length) return res.status(422).json({ error: "Select one class for every journey leg." });
  booking.seatSelections = selections.map((selection) => ({ ...selection, holdId: randomHold(), heldUntil: new Date(Date.now() + 8 * 60_000).toISOString() }));
  booking.status = "SEATS_HELD";
  res.json({ data: booking });
});
router.post("/bookings/:bookingId/payment", (req, res) => {
  const booking = findBooking(req.params.bookingId);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (!booking.passengers.length || !booking.seatSelections.length) return res.status(409).json({ error: "Passenger details and seat selections must be completed first." });
  booking.status = "CONFIRMED";
  booking.payment = { paymentId: `pay_${Date.now()}`, status: "SUCCESS", method: req.body.method || "UPI", paidAt: new Date().toISOString() };
  booking.pnr = String(Math.floor(1000000000 + Math.random() * 9000000000));
  res.json({ data: booking });
});
function randomHold() { return `hold_${Math.random().toString(36).slice(2, 10)}`; }
module.exports = router;
