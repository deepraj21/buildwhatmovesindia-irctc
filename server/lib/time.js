function atJourneyTime(date, time, dayOffset = 0) {
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00+05:30`);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function iso(date) {
  return date.toISOString();
}

module.exports = { atJourneyTime, iso };
