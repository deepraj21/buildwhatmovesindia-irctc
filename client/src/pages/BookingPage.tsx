import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, MapPin, TrainFront } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BookingNav from "../components/BookingNav";
import BookingProgress from "../components/BookingProgress";
import CoachSeatMap from "../components/CoachSeatMap";
import {
  getBooking,
  saveSeats,
  type Booking,
  type SeatSelection,
  type TravelClass,
} from "../lib/api";
import "./BookingPage.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function seatList(selection?: SeatSelection) {
  if (!selection) return [];
  if (selection.seatNumbers?.length) return selection.seatNumbers;
  return selection.seatNumber ? [selection.seatNumber] : [];
}

export default function BookingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selections, setSelections] = useState<SeatSelection[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then((loadedBooking) => {
        if (!loadedBooking.passengers.length) {
          navigate(`/booking/${bookingId}/passengers`, { replace: true });
          return;
        }
        setBooking(loadedBooking);
        setSelections(
          loadedBooking.itinerary.legs.map((leg, index) => {
            const saved = loadedBooking.seatSelections[index];
            const seats = seatList(saved);
            return {
              trainId: leg.trainId,
              classCode: saved?.classCode || "",
              seatNumber: seats[0] || "",
              seatNumbers: seats,
            };
          }),
        );
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Booking not found.");
      });
  }, [bookingId, navigate]);

  function chooseClass(legIndex: number, travelClass: TravelClass) {
    setSelections((current) =>
      current.map((selection, index) =>
        index === legIndex
          ? { ...selection, trainId: booking?.itinerary.legs[index].trainId || selection.trainId, classCode: travelClass.code, seatNumber: "", seatNumbers: [] }
          : selection,
      ),
    );
  }

  function toggleSeat(legIndex: number, seatNumber: string) {
    const needed = booking?.passengers.length || 1;
    setSelections((current) =>
      current.map((selection, index) => {
        if (index !== legIndex) return selection;
        const seats = seatList(selection);
        const alreadySelected = seats.includes(seatNumber);
        const nextSeats = alreadySelected
          ? seats.filter((seat) => seat !== seatNumber)
          : seats.length < needed
            ? [...seats, seatNumber]
            : [...seats.slice(1), seatNumber];
        return { ...selection, seatNumbers: nextSeats, seatNumber: nextSeats[0] || "" };
      }),
    );
  }

  async function holdSeats() {
    const needed = booking?.passengers.length || 1;
    if (!bookingId || selections.some((selection) => !selection.classCode || seatList(selection).length !== needed)) return;
    setIsSaving(true);
    setError("");
    try {
      const updatedBooking = await saveSeats(bookingId, selections);
      setBooking(updatedBooking);
      navigate(`/booking/${bookingId}/payment`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not hold the selected seats.");
    } finally {
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
        backTo={`/booking/${booking.id}/passengers`}
        backLabel="Back to passengers"
      />

      <BookingProgress current="seats" bookingId={booking.id} completed={["passengers"]} />

      <section className="seat-layout">
        <div className="seat-legs">
          {booking.itinerary.legs.map((leg, legIndex) => (
            <article className="seat-leg" key={leg.trainId}>
              <div className="seat-leg-heading">
                <div>
                  <span className="leg-number">LEG {legIndex + 1}</span>
                  <h2><TrainFront size={18} /> {leg.trainName}</h2>
                </div>
                <span className="seat-duration"><Clock3 size={14} /> {Math.floor(leg.durationMinutes / 60)}h {leg.durationMinutes % 60}m</span>
              </div>
              <div className="seat-route">
                <span><b>{formatDate(leg.departure)}</b><small><MapPin size={12} /> {leg.from}</small></span>
                <ArrowRight size={16} />
                <span className="seat-arrival"><b>{formatDate(leg.arrival)}</b><small><MapPin size={12} /> {leg.to}</small></span>
              </div>
              <div className="class-options">
                {leg.classes.map((travelClass) => {
                  const selected = selections[legIndex]?.classCode === travelClass.code;
                  return (
                    <button
                      type="button"
                      className={selected ? "class-option selected" : "class-option"}
                      key={travelClass.code}
                      onClick={() => chooseClass(legIndex, travelClass)}
                    >
                      <span className="class-check">{selected && <Check size={14} />}</span>
                      <strong>{travelClass.code}</strong>
                      <span>{travelClass.name}</span>
                      <small>{travelClass.available} seats available</small>
                      <b>₹{travelClass.fare.toLocaleString("en-IN")}</b>
                    </button>
                  );
                })}
              </div>
              {selections[legIndex]?.classCode && (
                <div className="berth-picker">
                  <div className="berth-heading">
                    <strong>Select {booking.passengers.length > 1 ? `${booking.passengers.length} berths` : "a berth"}</strong>
                    <span>{selections[legIndex].classCode} · {seatList(selections[legIndex]).length}/{booking.passengers.length} selected</span>
                  </div>
                  <CoachSeatMap
                    seats={leg.classes.find((travelClass) => travelClass.code === selections[legIndex].classCode)?.seats || []}
                    selectedSeats={seatList(selections[legIndex])}
                    onSelect={(seatNumber) => toggleSeat(legIndex, seatNumber)}
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        <aside className="seat-summary">
          <h2>Your selection</h2>
          <div className="booking-reference">
            <span>Booking ID</span>
            <strong>{booking.id}</strong>
          </div>
          {booking.passengers.map((passenger, index) => (
            <div className="summary-row" key={passenger.id || index}>
              <span>Passenger {index + 1}</span>
              <strong>{passenger.name}</strong>
            </div>
          ))}
          {selections.map((selection, index) => (
            <div className="summary-row" key={selection.trainId}>
              <span>Leg {index + 1}<small>{selection.trainId}</small></span>
              <strong>{selection.classCode ? `${selection.classCode} · ${seatList(selection).length ? `Seat ${seatList(selection).join(", ")}` : "Choose berth"}` : "Choose class"}</strong>
            </div>
          ))}
          <p className="hold-note">
            <Clock3 size={15} />
            {booking.status === "SEATS_HELD"
              ? "Your selected classes are held for 8 minutes."
              : "Seats are held only after you continue."}
          </p>
          {error && <p className="seat-error">{error}</p>}
          <button className="continue-button" type="button" onClick={holdSeats} disabled={isSaving || selections.some((selection) => !selection.classCode || seatList(selection).length !== booking.passengers.length)}>
            {isSaving ? "Holding seats…" : "Continue to payment"} <ArrowRight size={16} />
          </button>
        </aside>
      </section>
    </main>
  );
}
