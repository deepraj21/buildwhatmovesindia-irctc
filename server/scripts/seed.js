require("dotenv").config();
const { connectDatabase } = require("../config/database");
const Station = require("../models/Station");
const Train = require("../models/Train");
const { stations, trains } = require("../data/trains");

async function seed() {
  await connectDatabase();
  await Promise.all(stations.map((station) => Station.updateOne({ code: station.code }, { $set: station }, { upsert: true })));
  await Promise.all(trains.map((train) => Train.updateOne({ id: train.id }, { $set: train }, { upsert: true })));
  console.log(`Seeded ${stations.length} stations and ${trains.length} trains.`);
}

seed().catch((error) => { console.error("Seeding failed:", error.message); process.exitCode = 1; })
  .finally(() => require("mongoose").disconnect());
