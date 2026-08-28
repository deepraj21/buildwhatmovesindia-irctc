# Rail Journey Planner

## The Problem

Many people in India book journeys that require connecting trains. Finding the best combination can take a significant amount of time: travellers must search multiple routes, compare fares and schedules, estimate transfer time, and research how reliable each train is. This makes planning a connecting journey difficult and increases the risk of choosing a connection that is too tight or inconvenient.

## The Solution

Rail Journey Planner brings direct and connecting journey options together in one search. Search results first show available direct trains and also surface viable one-hop alternatives, so travellers can compare the full journey instead of researching each leg separately.

The planner uses historical delay data and deterministic calculations to evaluate connections. A connection is accepted only when there is enough time for a platform change and the incoming train's 90th-percentile historical delay. The result clearly shows the available buffer and reliability risk without presenting the connection as guaranteed.

Travellers can compare options by:

- **Balanced:** duration, starting fare, and connection risk
- **Fastest:** total journey time
- **Cheapest:** lowest available class fare across all legs

## One Booking For The Whole Journey

When a traveller chooses a connecting itinerary, both train legs are carried forward into a single booking. Seats, class selections, berth preferences, passenger details, pricing, and payment are managed together under one booking ID. This avoids repeating the booking process for each train and gives travellers one place to review the complete journey.

The guided flow is:

1. Search stations, date, passengers, and ranking preference
2. Compare direct and delay-aware connecting itineraries
3. Select classes and berth preferences for each leg
4. Add traveller and contact details once
5. Review the full itinerary and make one payment
6. Receive confirmation with the PNR, tickets, journey timeline, and connection guidance

The initial catalogue supports journeys such as `HWH → MYS`, including a direct service and a `HWH → SBC → MYS` alternative. `BLR` is supported as an alias for `SBC`.

For the product direction and API contract, see [the product and API plan](docs/product-and-api-plan.md).
