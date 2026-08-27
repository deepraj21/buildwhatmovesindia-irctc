const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSeedPayload } = require("../config/seed");

test("seed payload includes sample stations and trains", () => {
  const payload = buildSeedPayload();

  assert.ok(payload.stations.some((station) => station.code === "HWH"));
  assert.ok(payload.trains.some((train) => train.id === "22863"));
  assert.ok(payload.bookings.some((booking) => booking.status === "DRAFT"));
});
