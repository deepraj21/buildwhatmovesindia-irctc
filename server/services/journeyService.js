const Train = require("../models/Train");
const Station = require("../models/Station");
const mongoose = require("mongoose");
const { stations, trains: fallbackTrains } = require("../data/trains");
const { atJourneyTime, iso } = require("../lib/time");

const normalizeStation = async (code) => {
  const input = String(code || "").trim().toUpperCase();
  if (mongoose.connection.readyState !== 1) {
    const station = stations.find((item) => item.code === input || item.aliases?.includes(input));
    return station?.code;
  }
  const station = await Station.findOne({ $or: [{ code: input }, { aliases: input }] }).lean();
  return station?.code;
};

function buildLeg(train, date, departureDayOffset = 0) {
  const departure = atJourneyTime(date, train.departure, departureDayOffset);
  const arrival = atJourneyTime(date, train.arrival, departureDayOffset + train.arrivalDayOffset);
  return {
    trainId: train.id, trainName: train.name, from: train.from, to: train.to,
    departure: iso(departure), arrival: iso(arrival), durationMinutes: train.durationMinutes,
    punctuality: train.punctuality, classes: train.classes
  };
}

function lowestFare(leg) { return Math.min(...leg.classes.map((item) => item.fare)); }

function option({ id, legs, transferMinutes = 0, kind }) {
  const first = legs[0];
  const last = legs.at(-1);
  const totalMinutes = Math.round((new Date(last.arrival) - new Date(first.departure)) / 60000);
  const fareFrom = legs.reduce((total, leg) => total + lowestFare(leg), 0);
  const reliabilityRisk = legs.reduce((total, leg) => total + leg.punctuality.p90DelayMinutes, 0);
  return {
    id, kind, legs, transferMinutes, totalMinutes, fareFrom,
    reliability: { connectionRiskMinutes: reliabilityRisk, rating: reliabilityRisk <= 50 ? "high" : "medium" },
    summary: kind === "direct" ? "Direct journey" : `${legs.length - 1} connection · ${transferMinutes} min planned transfer`
  };
}

async function analyseJourney({ from, to, date, passengers = 1, sortBy = "balanced" }) {
  const [origin, destination] = await Promise.all([normalizeStation(from), normalizeStation(to)]);
  if (!origin || !destination) throw Object.assign(new Error("Unknown origin or destination station."), { status: 422 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) throw Object.assign(new Error("date must use YYYY-MM-DD."), { status: 422 });
  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 6) throw Object.assign(new Error("passengers must be an integer from 1 to 6."), { status: 422 });

  const trains = mongoose.connection.readyState === 1
    ? await Train.find({ $or: [{ from: origin }, { to: destination }] }).lean()
    : fallbackTrains.filter((train) => train.from === origin || train.to === destination);
  const direct = trains.filter((train) => train.from === origin && train.to === destination)
    .map((train) => option({ id: `direct-${train.id}`, kind: "direct", legs: [buildLeg(train, date)] }));
  const connecting = [];
  for (const firstTrain of trains.filter((train) => train.from === origin)) {
    for (const secondTrain of trains.filter((train) => train.from === firstTrain.to && train.to === destination)) {
      const firstLeg = buildLeg(firstTrain, date);
      let secondDayOffset = 0;
      let secondLeg = buildLeg(secondTrain, date, secondDayOffset);
      while (new Date(secondLeg.departure) <= new Date(firstLeg.arrival)) {
        secondDayOffset += 1;
        secondLeg = buildLeg(secondTrain, date, secondDayOffset);
      }
      const transferMinutes = Math.round((new Date(secondLeg.departure) - new Date(firstLeg.arrival)) / 60000);
      const requiredMinutes = 45 + firstLeg.punctuality.p90DelayMinutes;
      if (transferMinutes >= requiredMinutes) connecting.push(option({
        id: `hop-${firstTrain.id}-${secondTrain.id}`, kind: "connection", legs: [firstLeg, secondLeg], transferMinutes
      }));
    }
  }
  const options = [...direct, ...connecting];
  const factor = sortBy === "fastest" ? (item) => item.totalMinutes : sortBy === "cheapest" ? (item) => item.fareFrom : (item) => item.totalMinutes + item.fareFrom / 3 + item.reliability.connectionRiskMinutes * 4;
  options.sort((a, b) => factor(a) - factor(b));
  return {
    search: { from: origin, to: destination, date, passengers, sortBy },
    insight: direct.length ? "Direct services are available. Connections are included as alternatives." : "No direct service found. These connections include a delay-aware transfer buffer.",
    options
  };
}

module.exports = { analyseJourney, normalizeStation };
