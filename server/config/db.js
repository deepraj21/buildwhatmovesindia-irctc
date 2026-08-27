const mongoose = require("mongoose");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/railway_journey_planner";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`MongoDB connected: ${mongoUri}`);
    return mongoose.connection;
  } catch (error) {
    console.warn("MongoDB unavailable; continuing with in-memory data.", error.message);
    return null;
  }
}

module.exports = { connectDB, mongoUri };
