const mongoose = require("mongoose");

const travelClassSchema = new mongoose.Schema({
  code: { type: String, required: true }, name: { type: String, required: true },
  fare: { type: Number, required: true, min: 0 }, available: { type: Number, required: true, min: 0 }
}, { _id: false });
const punctualitySchema = new mongoose.Schema({
  averageDelayMinutes: { type: Number, required: true }, p90DelayMinutes: { type: Number, required: true }
}, { _id: false });
const trainSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true }, name: { type: String, required: true },
  from: { type: String, required: true, uppercase: true }, to: { type: String, required: true, uppercase: true },
  departure: { type: String, required: true }, arrival: { type: String, required: true },
  arrivalDayOffset: { type: Number, required: true, min: 0 }, durationMinutes: { type: Number, required: true, min: 1 },
  punctuality: { type: punctualitySchema, required: true }, classes: { type: [travelClassSchema], required: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Train", trainSchema);
