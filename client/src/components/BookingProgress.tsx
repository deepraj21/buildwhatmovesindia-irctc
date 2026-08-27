import { Link } from "react-router-dom";

type Step = "passengers" | "seats" | "payment";

const steps: { id: Step; label: string; number: number; path: string }[] = [
  { id: "passengers", label: "Passengers", number: 1, path: "passengers" },
  { id: "seats", label: "Seats", number: 2, path: "seats" },
  { id: "payment", label: "Payment", number: 3, path: "payment" },
];

export default function BookingProgress({
  current,
  bookingId,
  completed = [],
}: {
  current: Step;
  bookingId: string;
  completed?: Step[];
}) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <div className="booking-progress" aria-label="Booking progress">
      {steps.map((step, index) => {
        const isActive = step.id === current;
        const isDone = completed.includes(step.id) || index < currentIndex;
        const canNavigate = isDone && !isActive;
        const content = (
          <>
            <b>{isDone && !isActive ? "✓" : step.number}</b> {step.label}
          </>
        );

        return (
          <div key={step.id} className="booking-progress-step">
            <span className={isActive ? "active" : isDone ? "done" : undefined}>
              {canNavigate ? (
                <Link to={`/booking/${bookingId}/${step.path}`}>{content}</Link>
              ) : (
                content
              )}
            </span>
            {index < steps.length - 1 && <i aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
