const trains = [
  {
    id: "12357",
    name: "Durga Puja Express",
    from: "HWH",
    to: "SBC",
    departure: "06:00",
    arrival: "13:30",
    arrivalDayOffset: 1,
    durationMinutes: 1890,
    punctuality: { averageDelayMinutes: 34, p90DelayMinutes: 76 },
    classes: [
      { code: "1A", name: "First AC", fare: 4250, available: 4 },
      { code: "2A", name: "Second AC", fare: 2540, available: 12 },
      { code: "3A", name: "Third AC", fare: 1780, available: 31 }
    ]
  },
  {
    id: "22863",
    name: "Howrah–Mysuru SF Express",
    from: "HWH",
    to: "MYS",
    departure: "20:15",
    arrival: "07:10",
    arrivalDayOffset: 2,
    durationMinutes: 3535,
    punctuality: { averageDelayMinutes: 48, p90DelayMinutes: 112 },
    classes: [
      { code: "2A", name: "Second AC", fare: 3010, available: 6 },
      { code: "3A", name: "Third AC", fare: 2110, available: 22 },
      { code: "SL", name: "Sleeper", fare: 790, available: 65 }
    ]
  },
  {
    id: "16516",
    name: "Chamundi Express",
    from: "SBC",
    to: "MYS",
    departure: "18:00",
    arrival: "20:30",
    arrivalDayOffset: 0,
    durationMinutes: 150,
    punctuality: { averageDelayMinutes: 9, p90DelayMinutes: 21 },
    classes: [
      { code: "CC", name: "AC Chair Car", fare: 460, available: 28 },
      { code: "2S", name: "Second Sitting", fare: 155, available: 84 }
    ]
  },
  {
    id: "12028",
    name: "Shatabdi Express",
    from: "SBC",
    to: "MYS",
    departure: "11:20",
    arrival: "13:20",
    arrivalDayOffset: 0,
    durationMinutes: 120,
    punctuality: { averageDelayMinutes: 6, p90DelayMinutes: 16 },
    classes: [
      { code: "CC", name: "AC Chair Car", fare: 590, available: 9 },
      { code: "EC", name: "Executive Chair Car", fare: 1080, available: 3 }
    ]
  },
  {
    id: "12301",
    name: "Rajdhani Express",
    from: "HWH",
    to: "NDLS",
    departure: "16:55",
    arrival: "10:00",
    arrivalDayOffset: 1,
    durationMinutes: 1025,
    punctuality: { averageDelayMinutes: 18, p90DelayMinutes: 42 },
    classes: [
      { code: "1A", name: "First AC", fare: 5120, available: 2 },
      { code: "2A", name: "Second AC", fare: 3240, available: 17 },
      { code: "3A", name: "Third AC", fare: 2360, available: 19 }
    ]
  },
  {
    id: "12952",
    name: "Mumbai Rajdhani",
    from: "NDLS",
    to: "MMCT",
    departure: "16:55",
    arrival: "08:35",
    arrivalDayOffset: 1,
    durationMinutes: 940,
    punctuality: { averageDelayMinutes: 15, p90DelayMinutes: 36 },
    classes: [
      { code: "1A", name: "First AC", fare: 5400, available: 5 },
      { code: "2A", name: "Second AC", fare: 3370, available: 14 },
      { code: "3A", name: "Third AC", fare: 2480, available: 36 }
    ]
  }
];

const stations = [
  { code: "HWH", name: "Howrah Junction", city: "Kolkata" },
  { code: "SBC", name: "KSR Bengaluru", city: "Bengaluru", aliases: ["BLR"] },
  { code: "MYS", name: "Mysuru Junction", city: "Mysuru" },
  { code: "NDLS", name: "New Delhi", city: "Delhi" },
  { code: "MMCT", name: "Mumbai Central", city: "Mumbai" }
];

module.exports = { trains, stations };
