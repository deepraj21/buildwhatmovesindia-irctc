import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import type { JourneySearch } from "../lib/api";

const stationNames: Record<string, string> = {
  HWH: "Howrah Junction",
  SBC: "KSR Bengaluru",
  MYS: "Mysuru Junction",
  NDLS: "New Delhi",
  MMCT: "Mumbai Central",
};

function stationLabel(code: string) {
  return stationNames[code] || code;
}

export default function BookingNav({
  search,
  backTo,
  backLabel,
}: {
  search: JourneySearch;
  backTo: string;
  backLabel: string;
}) {
  return (
    <header className="booking-nav">
      <Link to={backTo} className="back">
        <ArrowLeft size={17} />
        {backLabel}
      </Link>
      <div>
        <h1>
          {stationLabel(search.from)} <ArrowRight size={20} /> {stationLabel(search.to)}
        </h1>
        <p className="journey-date">
          <CalendarDays size={14} />
          {new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(
            new Date(`${search.date}T12:00:00`),
          )}
        </p>
      </div>
    </header>
  );
}
