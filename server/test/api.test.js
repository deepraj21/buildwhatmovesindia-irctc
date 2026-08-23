const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/index");

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api/v1`); }
  finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test("analysis finds both direct and delay-aware HWH to MYS choices", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/journeys/analyse`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ from: "HWH", to: "MYS", date: "2026-09-15", passengers: 2 }) });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.search.to, "MYS");
    assert.ok(body.options.some((item) => item.kind === "direct"));
    assert.ok(body.options.some((item) => item.kind === "connection"));
  });
});

test("a booking confirms after travellers and seats are saved", async () => {
  await withServer(async (baseUrl) => {
    const analysis = await (await fetch(`${baseUrl}/journeys/analyse`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ from: "HWH", to: "MYS", date: "2026-09-15" }) })).json();
    const itinerary = analysis.options[0];
    const created = await (await fetch(`${baseUrl}/bookings`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ search: analysis.search, itinerary }) })).json();
    const id = created.data.id;
    await fetch(`${baseUrl}/bookings/${id}/passengers`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ passengers: [{ name: "Asha Sen", age: 31, gender: "FEMALE" }] }) });
    await fetch(`${baseUrl}/bookings/${id}/seats`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ selections: itinerary.legs.map((leg) => ({ trainId: leg.trainId, classCode: leg.classes[0].code })) }) });
    const confirmation = await (await fetch(`${baseUrl}/bookings/${id}/payment`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "UPI" }) })).json();
    assert.equal(confirmation.data.status, "CONFIRMED");
    assert.match(confirmation.data.pnr, /^\d{10}$/);
  });
});
