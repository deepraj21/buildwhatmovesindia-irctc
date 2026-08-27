const configuredServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const serverUrl = configuredServerUrl.replace(/\/+$/, "");

export const apiBaseUrl = serverUrl.endsWith("/api/v1")
  ? serverUrl
  : `${serverUrl}/api/v1`;

export type Station = {
  code: string;
  name: string;
  city: string;
  aliases?: string[];
};

export type JourneySearch = {
  from: string;
  to: string;
  date: string;
  passengers?: number;
  sortBy?: "balanced" | "fastest" | "cheapest";
};

export type TravelClass = { code: string; name: string; fare: number; available: number };
export type JourneyLeg = {
  trainId: string;
  trainName: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  punctuality: { averageDelayMinutes?: number; p90DelayMinutes: number };
  classes: TravelClass[];
};
export type ItineraryOption = {
  id: string;
  kind: "direct" | "connection";
  legs: JourneyLeg[];
  transferMinutes: number;
  totalMinutes: number;
  fareFrom: number;
  reliability: { connectionRiskMinutes: number; rating: string };
  summary: string;
};
export type JourneyAnalysis = {
  search: JourneySearch;
  insight: string;
  options: ItineraryOption[];
};
export type Passenger = {
  id?: string;
  name: string;
  age: number;
  gender: string;
  preference?: string;
};
export type SeatSelection = {
  trainId: string;
  classCode: string;
  holdId?: string;
  heldUntil?: string;
};
export type Booking = {
  id: string;
  status: string;
  search: JourneySearch;
  itinerary: ItineraryOption;
  passengers: Passenger[];
  seatSelections: SeatSelection[];
  payment?: { paymentId: string; status: string; method: string; paidAt: string };
  pnr?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error || "The server could not complete this request.");
  }

  return body;
}

export function getHealth() {
  return request<{ status: string; timestamp: string }>("/health");
}

export async function getStations(query = "") {
  const search = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await request<{ data: Station[] }>(`/stations${search}`);
  return response.data;
}

export function analyseJourney(search: JourneySearch) {
  return request<JourneyAnalysis>("/journeys/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(search),
  });
}

export async function createBooking(search: JourneySearch, itinerary: ItineraryOption) {
  const response = await request<{ data: Booking }>("/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search, itinerary }),
  });
  return response.data;
}

export async function getBooking(bookingId: string) {
  const response = await request<{ data: Booking }>(`/bookings/${encodeURIComponent(bookingId)}`);
  return response.data;
}

export async function savePassengers(bookingId: string, passengers: Passenger[]) {
  const response = await request<{ data: Booking }>(
    `/bookings/${encodeURIComponent(bookingId)}/passengers`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passengers }),
    },
  );
  return response.data;
}

export async function saveSeats(bookingId: string, selections: SeatSelection[]) {
  const response = await request<{ data: Booking }>(
    `/bookings/${encodeURIComponent(bookingId)}/seats`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections }),
    },
  );
  return response.data;
}

export async function payBooking(bookingId: string, method = "UPI") {
  const response = await request<{ data: Booking }>(
    `/bookings/${encodeURIComponent(bookingId)}/payment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    },
  );
  return response.data;
}
