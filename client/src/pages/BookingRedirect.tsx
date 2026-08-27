import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBooking } from "../lib/api";

export default function BookingRedirect() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookingId) return;
    getBooking(bookingId)
      .then((booking) => {
        if (booking.status === "CONFIRMED") {
          navigate(`/booking/${bookingId}/payment`, { replace: true });
          return;
        }
        if (!booking.passengers.length) {
          navigate(`/booking/${bookingId}/passengers`, { replace: true });
          return;
        }
        if (!booking.seatSelections.length) {
          navigate(`/booking/${bookingId}/seats`, { replace: true });
          return;
        }
        navigate(`/booking/${bookingId}/payment`, { replace: true });
      })
      .catch(() => {
        navigate("/journeys", { replace: true });
      });
  }, [bookingId, navigate]);

  return <main className="booking-page booking-message">Loading your booking…</main>;
}
