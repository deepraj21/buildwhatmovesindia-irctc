import type { TravelSeat } from "../lib/api";
import "./CoachSeatMap.css";

type CoachSeatMapProps = {
  seats: TravelSeat[];
  selectedSeats?: string[];
  onSelect: (seatNumber: string) => void;
};

type Bay = {
  index: number;
  top: TravelSeat[];
  bottom: TravelSeat[];
};

function groupSeatsIntoBays(seats: TravelSeat[]): Bay[] {
  const bays = new Map<number, Bay>();

  for (const seat of seats) {
    const seatNumber = Number(seat.number);
    const positionInBay = (seatNumber - 1) % 6;
    const bayIndex = seat.layout?.bay ?? Math.floor((seatNumber - 1) / 6);
    const row = seat.layout?.row ?? (positionInBay < 3 ? "top" : "bottom");
    const column = seat.layout?.column ?? positionInBay % 3;
    const existing = bays.get(bayIndex) ?? { index: bayIndex, top: [], bottom: [] };

    if (row === "bottom") {
      existing.bottom[column] = seat;
    } else {
      existing.top[column] = seat;
    }

    bays.set(bayIndex, existing);
  }

  return [...bays.values()].sort((left, right) => left.index - right.index);
}

function berthClass(seat: TravelSeat) {
  const code = seat.berthCode || seat.berth.slice(0, 1).toUpperCase();
  if (code === "L" || code === "SL") return "berth-lower";
  if (code === "M") return "berth-middle";
  if (code === "U" || code === "SU") return "berth-upper";
  if (code === "W") return "berth-window";
  if (code === "A") return "berth-aisle";
  return "berth-default";
}

function berthCode(seat: TravelSeat) {
  if (seat.berthCode) return seat.berthCode;
  const normalized = seat.berth.toLowerCase();
  if (normalized.includes("side lower")) return "SL";
  if (normalized.includes("side upper")) return "SU";
  if (normalized.includes("lower")) return "L";
  if (normalized.includes("upper")) return "U";
  if (normalized.includes("middle")) return "M";
  if (normalized.includes("window")) return "W";
  if (normalized.includes("aisle")) return "A";
  return seat.berth.slice(0, 2).toUpperCase();
}

function berthAriaLabel(seat: TravelSeat) {
  const code = berthCode(seat);
  return `${seat.berth} (${code})`;
}

function SeatButton({
  seat,
  selected,
  onSelect,
}: {
  seat: TravelSeat;
  selected: boolean;
  onSelect: (seatNumber: string) => void;
}) {
  const blocked = seat.available === false;

  return (
    <button
      type="button"
      className={`coach-seat ${berthClass(seat)}${selected ? " selected" : ""}${blocked ? " blocked" : ""}`}
      disabled={blocked}
      aria-label={`Seat ${seat.number}, ${berthAriaLabel(seat)}${blocked ? ", unavailable" : ""}`}
      onClick={() => onSelect(seat.number)}
    >
      <strong>{seat.number}</strong>
      <span>{berthCode(seat)}</span>
    </button>
  );
}

function SeatRow({
  seats,
  selectedSeats,
  onSelect,
  rowKey,
}: {
  seats: TravelSeat[];
  selectedSeats?: string[];
  onSelect: (seatNumber: string) => void;
  rowKey: string;
}) {
  return (
    <div className="coach-seat-row">
      {seats.map((seat, columnIndex) =>
        seat ? (
          <SeatButton
            key={seat.number}
            seat={seat}
            selected={selectedSeats?.includes(seat.number) || false}
            onSelect={onSelect}
          />
        ) : (
          <span className="coach-seat-spacer" key={`${rowKey}-empty-${columnIndex}`} />
        ),
      )}
    </div>
  );
}

export default function CoachSeatMap({ seats, selectedSeats = [], onSelect }: CoachSeatMapProps) {
  const bays = groupSeatsIntoBays(seats);

  if (!bays.length) return null;

  return (
    <div className="coach-map" role="group" aria-label="Coach seat map">
      <div className="coach-scroll">
        <div className="coach-end coach-end-entry">
          <span>Entry</span>
        </div>

        {bays.map((bay) => (
          <div className="coach-bay" key={bay.index} aria-label={`Bay ${bay.index + 1}`}>
            <SeatRow seats={bay.top} selectedSeats={selectedSeats} onSelect={onSelect} rowKey={`bay-${bay.index}-top`} />
            <div className="coach-aisle" aria-hidden="true" />
            <SeatRow seats={bay.bottom} selectedSeats={selectedSeats} onSelect={onSelect} rowKey={`bay-${bay.index}-bottom`} />
          </div>
        ))}

        <div className="coach-end coach-end-exit">
          <span>Exit</span>
        </div>
      </div>
    </div>
  );
}
