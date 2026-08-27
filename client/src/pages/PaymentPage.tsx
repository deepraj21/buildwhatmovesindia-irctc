import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, IndianRupee, ShieldCheck, TrainFront } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookingNav from "../components/BookingNav";
import BookingProgress from "../components/BookingProgress";
import { getBooking, payBooking, type Booking } from "../lib/api";
import "./BookingPage.css";

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Credit / Debit card" },
  { value: "NET_BANKING", label: "Net banking" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function totalFare(booking: Booking) {
  const passengers = Math.max(1, booking.search.passengers || booking.passengers.length || 1);
  return booking.itinerary.legs.reduce((total, leg, index) => {
    const selection = booking.seatSelections[index];
    const travelClass = leg.classes.find((item) => item.code === selection?.classCode);
    return total + (travelClass?.fare || 0) * passengers;
  }, 0);
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState("UPI");
  const [error, setError] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then((loadedBooking) => {
        if (!loadedBooking.passengers.length) {
          navigate(`/booking/${bookingId}/passengers`, { replace: true });
          return;
        }
        if (!loadedBooking.seatSelections.length) {
          navigate(`/booking/${bookingId}/seats`, { replace: true });
          return;
        }
        setBooking(loadedBooking);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Booking not found.");
      });
  }, [bookingId, navigate]);

  const fare = useMemo(() => (booking ? totalFare(booking) : 0), [booking]);

  async function completePayment() {
    if (!bookingId || !booking) return;
    setIsPaying(true);
    setError("");
    try {
      const confirmed = await payBooking(bookingId, method);
      setBooking(confirmed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Payment could not be completed.");
      setIsPaying(false);
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
    return <main className="booking-page booking-message">Loading payment details…</main>;
  }

  if (booking.status === "CONFIRMED" && booking.pnr) {
    return (
      <main className="booking-page">
        <BookingNav
          search={booking.search}
          backTo={`/journeys?from=${booking.search.from}&to=${booking.search.to}&date=${booking.search.date}`}
          backLabel="Modify search"
        />

        <BookingProgress
          current="payment"
          bookingId={booking.id}
          completed={["passengers", "seats", "payment"]}
        />

        <section className="confirmation-panel">
          <div className="confirmation-card">
            <CheckCircle2 size={42} />
            <h2>Payment successful</h2>
            <p>PNR <strong>{booking.pnr}</strong></p>
            <div className="confirmation-grid">
              <div>
                <span>Booking ID</span>
                <strong>{booking.id}</strong>
              </div>
              <div>
                <span>Payment method</span>
                <strong>{booking.payment?.method || method}</strong>
              </div>
              <div>
                <span>Journey date</span>
                <strong>{formatDate(booking.search.date)}</strong>
              </div>
              <div>
                <span>Total paid</span>
                <strong>₹{fare.toLocaleString("en-IN")}</strong>
              </div>
            </div>
            <div className="confirmation-passengers">
              <h3>Passengers</h3>
              {booking.passengers.map((passenger) => (
                <p key={passenger.id}>{passenger.name} · {passenger.age} · {passenger.gender}</p>
              ))}
            </div>
            <div className="confirmation-legs">
              <h3>Train details</h3>
              {booking.itinerary.legs.map((leg, index) => {
                const selection = booking.seatSelections[index];
                return (
                  <p key={leg.trainId}>
                    <TrainFront size={14} /> {leg.trainName} · {selection?.classCode} · Seat {(selection?.seatNumbers || [selection?.seatNumber]).filter(Boolean).join(", ")}
                  </p>
                );
              })}
            </div>
            <Link to="/journeys" className="continue-button confirmation-action">
              Book another journey
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <BookingNav
        search={booking.search}
        backTo={`/booking/${booking.id}/seats`}
        backLabel="Back to seats"
      />

      <BookingProgress
        current="payment"
        bookingId={booking.id}
        completed={["passengers", "seats"]}
      />

      <section className="flow-layout">
        <div className="flow-main">
          <article className="passenger-card">
            <h2>Passengers</h2>
            <div className="review-list">
              {booking.passengers.map((passenger, index) => (
                <div className="review-row" key={passenger.id || index}>
                  <span>Passenger {index + 1}</span>
                  <strong>{passenger.name}</strong>
                  <small>{passenger.age} yrs · {passenger.gender.replace("_", " ")}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="passenger-card">
            <h2>Seat selections</h2>
            <div className="review-list">
              {booking.itinerary.legs.map((leg, index) => {
                const selection = booking.seatSelections[index];
                return (
                  <div className="review-row" key={leg.trainId}>
                    <span>Leg {index + 1} · {leg.trainId}</span>
                    <strong>{selection?.classCode} · Seat {(selection?.seatNumbers || [selection?.seatNumber]).filter(Boolean).join(", ")}</strong>
                    <small>{leg.from} → {leg.to}</small>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="passenger-card">
            <h2>Payment method</h2>
            <div className="payment-methods">
              {PAYMENT_METHODS.map((option) => (
                <label className={method === option.value ? "payment-option selected" : "payment-option"} key={option.value}>
                  <input
                    type="radio"
                    name="payment-method"
                    value={option.value}
                    checked={method === option.value}
                    onChange={() => setMethod(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p className="payment-note">
              <ShieldCheck size={15} />
              Payments are processed securely. Your seat hold expires at{" "}
              {booking.seatSelections[0]?.heldUntil
                ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
                    new Date(booking.seatSelections[0].heldUntil),
                  )
                : "soon"}.
            </p>
          </article>
        </div>

        <aside className="seat-summary">
          <h2>Amount payable</h2>
          <div className="booking-reference">
            <span>Booking ID</span>
            <strong>{booking.id}</strong>
          </div>
          {booking.itinerary.legs.map((leg, index) => {
            const selection = booking.seatSelections[index];
            const travelClass = leg.classes.find((item) => item.code === selection?.classCode);
            const passengers = Math.max(1, booking.search.passengers || booking.passengers.length);
            return (
              <div className="summary-row" key={leg.trainId}>
                <span>Leg {index + 1}<small>{selection?.classCode}</small></span>
                <strong>₹{((travelClass?.fare || 0) * passengers).toLocaleString("en-IN")}</strong>
              </div>
            );
          })}
          <div className="fare-total">
            <span><IndianRupee size={15} /> Total</span>
            <strong>₹{fare.toLocaleString("en-IN")}</strong>
          </div>
          {error && <p className="seat-error">{error}</p>}
          <button className="continue-button" type="button" onClick={completePayment} disabled={isPaying}>
            {isPaying ? "Processing payment…" : `Pay ₹${fare.toLocaleString("en-IN")}`}
          </button>
        </aside>
      </section>
    </main>
  );
}
