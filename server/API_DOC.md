# Rail Journey Planner API Reference

Base URL: `/api/v1`  
Content type: `application/json`

All successful responses use JSON. Fields marked **required** must be provided. Error responses have the shape `{ "error": "Human-readable message" }`.

## Database setup

The API uses MongoDB for stations, trains, and bookings. Copy `.env.example` to `.env`, set `MONGO_URI`, then run `npm run seed` once to load the included dummy railway data. The seed command is idempotent, so it can be rerun after data changes.

## API maintenance rule

Update this document in the same change whenever an endpoint, HTTP method, request field, response field, validation rule, or status code changes. Client applications should treat this file as the API contract.

## Endpoints at a glance

| Method | Path | What it does | Success status |
| --- | --- | --- | --- |
| `GET` | `/health` | Checks whether the API is reachable. | `200` |
| `GET` | `/stations?q={query}` | Finds origin/destination stations for autocomplete. | `200` |
| `POST` | `/journeys/analyse` | Finds direct and connection-based itinerary options. | `200` |
| `POST` | `/bookings` | Creates a draft booking from the itinerary chosen on the results screen. | `201` |
| `GET` | `/bookings/:bookingId` | Retrieves the current state of a booking. | `200` |
| `PUT` | `/bookings/:bookingId/passengers` | Saves shared passenger details for all itinerary legs. | `200` |
| `PUT` | `/bookings/:bookingId/seats` | Saves one class/seat selection for each leg and creates seat holds. | `200` |
| `POST` | `/bookings/:bookingId/payment` | Pays for and confirms the complete booking. | `200` |

## `GET /health`

Checks that the API is available.

| Input | Location | Required | Description |
| --- | --- | --- | --- |
| — | — | — | No input. |

| Output field | Type | Description |
| --- | --- | --- |
| `status` | string | Always `"ok"` when the service is available. |
| `timestamp` | ISO-8601 datetime | Time at which the health response was created. |

```json
{ "status": "ok", "timestamp": "2026-08-23T10:00:00.000Z" }
```

## `GET /stations`

Searches stations for the search-form autocomplete.

| Input | Location | Required | Description |
| --- | --- | --- | --- |
| `q` | query string | No | Station code, name, or city. Omit it to return all supported stations. |

| Output field | Type | Description |
| --- | --- | --- |
| `data` | `Station[]` | Matching stations. |
| `data[].code` | string | Canonical station code, for example `HWH`. |
| `data[].name` | string | Station name. |
| `data[].city` | string | City name. |
| `data[].aliases` | string[] | Optional alternate codes accepted by the API. |

```json
{
  "data": [{ "code": "HWH", "name": "Howrah Junction", "city": "Kolkata" }]
}
```

## `POST /journeys/analyse`

Analyses a requested journey and returns ranked direct and delay-aware connecting itineraries. `BLR` is accepted as an alias for `SBC`.

### Input payload

| Field | Type | Required | Allowed values / format | Description |
| --- | --- | --- | --- | --- |
| `from` | string | **Yes** | Station code | Origin station. |
| `to` | string | **Yes** | Station code | Destination station. |
| `date` | string | **Yes** | `YYYY-MM-DD` | Journey departure date. |
| `passengers` | integer | No | `1`–`6`; defaults to `1` | Number of travellers. |
| `sortBy` | string | No | `balanced` (default), `fastest`, `cheapest` | Ranking preference. |

```json
{
  "from": "HWH",
  "to": "MYS",
  "date": "2026-09-15",
  "passengers": 2,
  "sortBy": "balanced"
}
```

### Output payload

| Field | Type | Description |
| --- | --- | --- |
| `search` | object | Normalized search criteria; station aliases are replaced by canonical codes. |
| `insight` | string | Summary explaining whether direct services were found. |
| `options` | `ItineraryOption[]` | Ranked journey choices. |
| `options[].id` | string | Stable option identifier for display and selection. |
| `options[].kind` | string | `direct` or `connection`. |
| `options[].legs` | `JourneyLeg[]` | One train for a direct journey; two trains for a connection. |
| `options[].transferMinutes` | integer | Planned connection time; `0` for a direct journey. |
| `options[].totalMinutes` | integer | Total journey duration, including connection time. |
| `options[].fareFrom` | number | Lowest available combined fare across the legs. |
| `options[].reliability` | object | Connection-risk calculation and rating. |
| `options[].summary` | string | UI-ready itinerary summary. |

| `JourneyLeg` field | Type | Description |
| --- | --- | --- |
| `trainId`, `trainName` | string | Train identifier and name. |
| `from`, `to` | string | Leg station codes. |
| `departure`, `arrival` | ISO-8601 datetime | Scheduled leg times. |
| `durationMinutes` | integer | Scheduled duration. |
| `punctuality.averageDelayMinutes` | integer | Historical average delay. |
| `punctuality.p90DelayMinutes` | integer | Delay used to calculate the safe transfer buffer. |
| `classes[]` | `TravelClass[]` | Available travel classes for this leg. |

| `TravelClass` field | Type | Description |
| --- | --- | --- |
| `code` | string | Class code, such as `3A`, `SL`, or `CC`. |
| `name` | string | Display name of the class. |
| `fare` | number | Per-passenger fare. |
| `available` | integer | Available seats. |

## `POST /bookings`

Creates the draft that holds booking state across the traveller, seat-selection, review, and payment screens. Send the full selected `ItineraryOption` returned by `/journeys/analyse`.

### Input payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `search` | object | **Yes** | The `search` object from the analysis response. |
| `itinerary` | `ItineraryOption` | **Yes** | The selected item from the analysis response; it must contain at least one leg. |

### Output payload

| Field | Type | Description |
| --- | --- | --- |
| `data` | `Booking` | Newly created booking with `status: "DRAFT"`. |

Returns `201 Created`. Use `data.id` as `:bookingId` in all following requests.

## `GET /bookings/:bookingId`

Returns the complete current booking state so a client can restore a paused multi-page flow.

| Input | Location | Required | Description |
| --- | --- | --- | --- |
| `bookingId` | path | **Yes** | Booking ID returned by `POST /bookings`. |

| Output field | Type | Description |
| --- | --- | --- |
| `data` | `Booking` | Complete booking state. |

Returns `404` when the booking does not exist.

## `PUT /bookings/:bookingId/passengers`

Saves passenger details once for the full itinerary.

### Input payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `passengers` | `Passenger[]` | **Yes** | One or more passengers. |
| `passengers[].id` | string | No | Client-side passenger ID. An ID is generated when omitted. |
| `passengers[].name` | string | **Yes** | Passenger full name. |
| `passengers[].age` | integer | **Yes** | Passenger age. |
| `passengers[].gender` | string | **Yes** | Passenger gender. |
| `passengers[].preference` | string | No | Berth preference; defaults to `NO_PREFERENCE`. |

```json
{
  "passengers": [
    { "name": "Asha Sen", "age": 31, "gender": "FEMALE", "preference": "LOWER" }
  ]
}
```

### Output payload

| Field | Type | Description |
| --- | --- | --- |
| `data` | `Booking` | Updated booking, including normalized passengers. |

Returns `404` for an unknown booking and `422` if any passenger is missing `name`, `age`, or `gender`.

## `PUT /bookings/:bookingId/seats`

Stores one class selection for every itinerary leg and creates time-limited holds.

### Input payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `selections` | `SeatSelection[]` | **Yes** | Must have exactly one selection per itinerary leg. |
| `selections[].trainId` | string | **Yes** | Train ID from the corresponding journey leg. |
| `selections[].classCode` | string | **Yes** | Selected class code from the corresponding journey leg. |

```json
{
  "selections": [
    { "trainId": "22863", "classCode": "3A" }
  ]
}
```

### Output payload

| Field | Type | Description |
| --- | --- | --- |
| `data` | `Booking` | Updated booking with `status: "SEATS_HELD"`. |
| `data.seatSelections[].holdId` | string | Seat-hold identifier. |
| `data.seatSelections[].heldUntil` | ISO-8601 datetime | Hold expiry timestamp. |

Returns `404` for an unknown booking and `422` unless the selection count matches the number of itinerary legs and each selection matches its train and an available class.

## `POST /bookings/:bookingId/payment`

Completes payment and confirms all legs in one booking.

### Input payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `method` | string | No | Payment method; defaults to `UPI`. |

```json
{ "method": "UPI" }
```

### Output payload

| Field | Type | Description |
| --- | --- | --- |
| `data` | `Booking` | Confirmed booking with `status: "CONFIRMED"`. |
| `data.pnr` | string | Generated 10-digit PNR. |
| `data.payment.paymentId` | string | Payment identifier. |
| `data.payment.status` | string | `SUCCESS`. |
| `data.payment.method` | string | Selected payment method. |
| `data.payment.paidAt` | ISO-8601 datetime | Confirmation time. |

Returns `404` for an unknown booking and `409` if passenger details or seat selections have not been saved.

## Shared `Booking` object

| Field | Type | Present when | Description |
| --- | --- | --- | --- |
| `id` | UUID string | Always | Booking identifier. |
| `status` | string | Always | `DRAFT`, `SEATS_HELD`, or `CONFIRMED`. |
| `search` | object | Always | Original normalized search criteria. |
| `itinerary` | `ItineraryOption` | Always | Selected train journey. |
| `passengers` | `Passenger[]` | Always | Empty until saved. |
| `seatSelections` | `SeatSelection[]` | Always | Empty until saved. |
| `createdAt` | ISO-8601 datetime | Always | Booking creation time. |
| `payment` | object | After payment | Payment confirmation details. |
| `pnr` | string | After payment | Confirmation PNR. |

## Common errors

| Status | Meaning | Example cause |
| --- | --- | --- |
| `404` | Resource or route not found. | Unknown `bookingId`. |
| `409` | Booking is not ready for the requested state transition. | Paying before saving passengers or seats. |
| `422` | Request payload is invalid. | Invalid date, station, traveller count, passenger, or seat-selection count. |
| `500` | Unexpected server error. | Unhandled service failure. |
