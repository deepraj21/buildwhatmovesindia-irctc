const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  status: { type: String, required: true, default: "DRAFT" },
  search: { type: mongoose.Schema.Types.Mixed, required: true },
  itinerary: { type: mongoose.Schema.Types.Mixed, required: true },
  passengers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  seatSelections: { type: [mongoose.Schema.Types.Mixed], default: [] },
  payment: mongoose.Schema.Types.Mixed,
  pnr: String,
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { transform: (_document, response) => { delete response._id; return response; } },
  toObject: { virtuals: true }
});

module.exports = mongoose.model("Booking", bookingSchema);
