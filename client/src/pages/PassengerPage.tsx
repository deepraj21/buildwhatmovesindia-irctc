import { useEffect, useState } from "react";
import { ArrowRight, Plus, Trash2, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookingNav from "../components/BookingNav";
import BookingProgress from "../components/BookingProgress";
import { getBooking, savePassengers, type Booking, type Passenger } from "../lib/api";
import "./BookingPage.css";

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "TRANSGENDER", label: "Transgender" },
];

const PREFERENCES = [
  { value: "NO_PREFERENCE", label: "No preference" },
  { value: "LOWER", label: "Lower berth" },
  { value: "MIDDLE", label: "Middle berth" },
  { value: "UPPER", label: "Upper berth" },
  { value: "SIDE_LOWER", label: "Side lower" },
  { value: "SIDE_UPPER", label: "Side upper" },
];

function emptyPassenger(): Passenger {
  return { name: "", age: 0, gender: "", preference: "NO_PREFERENCE" };
}

export default function PassengerPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then((loadedBooking) => {
        if (loadedBooking.status === "CONFIRMED") {
          navigate(`/booking/${bookingId}/payment`, { replace: true });
          return;
        }
        setBooking(loadedBooking);
        const existing = loadedBooking.passengers || [];
        setPassengers(
          existing.length
            ? existing.map((passenger, index) => ({ ...passenger, id: passenger.id || `P${index + 1}` }))
            : [{ ...emptyPassenger(), id: "P1" }],
        );
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Booking not found.");
      });
  }, [bookingId, navigate]);

  function updatePassenger(index: number, field: keyof Passenger, value: string | number) {
    setPassengers((current) =>
      current.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger,
      ),
    );
  }

  function addPassenger() {
    if (passengers.length >= 6) return;
    setPassengers((current) => [...current, { ...emptyPassenger(), id: `P${current.length + 1}` }]);
  }

  function removePassenger(index: number) {
    if (passengers.length <= 1) return;
    setPassengers((current) => current.filter((_passenger, passengerIndex) => passengerIndex !== index));
  }

  function isValid() {
    return passengers.every(
      (passenger) =>
        passenger.name.trim().length >= 2 &&
        Number(passenger.age) >= 1 &&
        Number(passenger.age) <= 120 &&
        passenger.gender,
    );
  }

  async function continueToSeats() {
    if (!bookingId || !isValid()) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = await savePassengers(
        bookingId,
        passengers.map((passenger) => ({
          ...passenger,
          name: passenger.name.trim(),
          age: Number(passenger.age),
        })),
      );
      setBooking(saved);
      navigate(`/booking/${bookingId}/seats`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save passenger details.");
      setIsSaving(false);
    }
  }

  if (error && !booking) {
    return (
      <main className="booking-page booking-message">
        <p>{error}</p>
        <Link to="/journeys">Return to journeys</Link>
      </main>
    );
  }

  if (!booking) {
    return <main className="booking-page booking-message">Loading your booking…</main>;
  }

  return (
    <main className="booking-page">
      <BookingNav
        search={booking.search}
        backTo={`/journeys?from=${booking.search.from}&to=${booking.search.to}&date=${booking.search.date}`}
        backLabel="Modify search"
      />

      <BookingProgress current="passengers" bookingId={booking.id} />

      <section className="flow-layout">
        <div className="flow-main">
          {passengers.map((passenger, index) => (
            <article className="passenger-card" key={passenger.id || index}>
              <div className="passenger-card-heading">
                <h2>
                  <UserRound size={17} /> Passenger {index + 1}
                </h2>
                {passengers.length > 1 && (
                  <button type="button" className="remove-passenger" onClick={() => removePassenger(index)}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
              <div className="passenger-fields">
                <label className="field-block">
                  <span>Full name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={passenger.name}
                    onChange={(event) => updatePassenger(index, "name", event.target.value)}
                    placeholder="As on ID proof"
                  />
                </label>
                <label className="field-block">
                  <span>Age</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={passenger.age || ""}
                    onChange={(event) => updatePassenger(index, "age", event.target.value)}
                    placeholder="Age"
                  />
                </label>
                <label className="field-block">
                  <span>Gender</span>
                  <select
                    value={passenger.gender}
                    onChange={(event) => updatePassenger(index, "gender", event.target.value)}
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-block">
                  <span>Berth preference</span>
                  <select
                    value={passenger.preference || "NO_PREFERENCE"}
                    onChange={(event) => updatePassenger(index, "preference", event.target.value)}
                  >
                    {PREFERENCES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </article>
          ))}
          {passengers.length < 6 && (
            <button type="button" className="add-passenger" onClick={addPassenger}>
              <Plus size={16} /> Add passenger
            </button>
          )}
        </div>

        <aside className="seat-summary">
          <h2>Journey summary</h2>
          <div className="booking-reference">
            <span>Booking ID</span>
            <strong>{booking.id}</strong>
          </div>
          <div className="summary-row">
            <span>Route<small>{booking.search.from} → {booking.search.to}</small></span>
            <strong>{booking.search.date}</strong>
          </div>
          <div className="summary-row">
            <span>Travellers</span>
            <strong>{passengers.length}</strong>
          </div>
          <div className="summary-row">
            <span>Journey</span>
            <strong>{booking.itinerary.summary}</strong>
          </div>
          {error && <p className="seat-error">{error}</p>}
          <button className="continue-button" type="button" onClick={continueToSeats} disabled={isSaving || !isValid()}>
            {isSaving ? "Saving passengers…" : "Continue to seats"} <ArrowRight size={16} />
          </button>
        </aside>
      </section>
    </main>
  );
}
