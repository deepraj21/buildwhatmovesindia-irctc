# Rail journey planner: product and API plan

## Product direction

This is a guided, multi-page rail-booking flow, not a chat UI. The initial sketch translates to: search → route analysis → itinerary and class selection → traveller details → review and payment → confirmation. A booking is one journey even when it contains multiple train legs, so travellers, pricing, and payment are managed once.

## Journey intelligence

For every search, the planner first ranks direct trains. It also returns viable one-hop options so the traveller can compare them. If no direct train is available, it finds pairs of trains whose station matches and accepts only connections with enough time for a platform change plus the incoming train's 90th-percentile historical delay. The results expose the buffer and reliability risk plainly; they never imply a guaranteed connection.

Initial ranking modes:

- `balanced` (default): duration, starting fare, and connection risk
- `fastest`: total door-to-door journey time
- `cheapest`: lowest available class fare across all legs

The initial service catalogue supports the key example: `HWH → MYS` has a direct service plus a `HWH → SBC → MYS` alternative. The API aliases `BLR` to `SBC`.

## Screens and state

| Screen | Primary decision | Server state |
| --- | --- | --- |
| Search | stations, date, travellers, sort preference | analysis request only |
| Results | direct or hop itinerary | selected itinerary becomes a draft booking |
| Seats | class and berth preference per leg | temporary seat holds |
| Travellers | all passenger details once | passenger list on booking |
| Review & pay | contact, policy acknowledgement, payment method | one payment for all legs |
| Confirmation | PNR, tickets, timeline, connection guidance | confirmed booking |

## API contract

Base URL: `/api/v1`. All responses are JSON.

| Method and path | Purpose |
| --- | --- |
| `GET /health` | server readiness |
| `GET /stations?q=kol` | station autocomplete |
| `POST /journeys/analyse` | direct and delay-aware hop options |
| `POST /bookings` | create a draft from a chosen result option |
| `GET /bookings/:bookingId` | restore multi-page booking state |
| `PUT /bookings/:bookingId/passengers` | save shared traveller details |
| `PUT /bookings/:bookingId/seats` | select classes and create 8-minute seat holds |
| `POST /bookings/:bookingId/payment` | confirm the whole itinerary with payment |

### Analysis request

```json
{
  "from": "HWH",
  "to": "MYS",
  "date": "2026-09-15",
  "passengers": 2,
  "sortBy": "balanced"
}
```

Each option contains leg schedules, train delay statistics, available classes, a starting fare, a total duration, and a connection buffer. The front end should persist the full selected option when it calls `POST /bookings`.

## Real-data integration boundary

The `journeyService` is deliberately isolated so a rail-inventory provider can be integrated without changing client routes. The service requires live quotas and fares, passenger and payment compliance, transaction idempotency, authentication, encryption, and an explicit recovery flow when a multi-leg booking only partially confirms.
