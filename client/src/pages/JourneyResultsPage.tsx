import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  TrainFront,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { analyseJourney, type JourneyAnalysis } from "../lib/api";
import "./JourneyResultsPage.css";

type TravelClass = { code: string; name: string; fare: number; available: number };
type Leg = {
  trainId: string;
  trainName: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  punctuality: { p90DelayMinutes: number };
  classes: TravelClass[];
};
type Option = {
  id: string;
  kind: "direct" | "connection";
  legs: Leg[];
  transferMinutes: number;
  totalMinutes: number;
  fareFrom: number;
  reliability: { connectionRiskMinutes: number; rating: string };
  summary: string;
};
const stationNames: Record<string, string> = {
  HWH: "Howrah Junction",
  SBC: "KSR Bengaluru",
  MYS: "Mysuru Junction",
  NDLS: "New Delhi",
  MMCT: "Mumbai Central",
};
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

function JourneyCard({ option }: { option: Option }) {
  return (
    <article className="journey-card">
      <div className="journey-card-top">
        <span className={option.kind}>
          {option.kind === "connection" ? "Connecting journey" : "Direct train"}
        </span>
        <strong>{option.summary}</strong>
        <span className="journey-duration">
          <Clock3 size={15} />
          {duration(option.totalMinutes)}
        </span>
      </div>
      <div className="journey-legs">
        {option.legs.map((leg, index) => (
          <div className="leg" key={leg.trainId}>
            <div className="leg-meta">
              <TrainFront size={18} />
              <b>{leg.trainName}</b>
              <span>#{leg.trainId}</span>
            </div>
            <div className="leg-route">
              <div>
                <b>{formatTime(leg.departure)}</b>
                <span>
                  <MapPin size={13} />
                  {stationNames[leg.from] || leg.from}
                </span>
              </div>
              <div className="route-line">
                <span>{duration(leg.durationMinutes)}</span>
                <i />
              </div>
              <div className="arrival">
                <b>{formatTime(leg.arrival)}</b>
                <span>
                  <MapPin size={13} />
                  {stationNames[leg.to] || leg.to}
                </span>
              </div>
            </div>
            <div className="classes">
              {leg.classes.slice(0, 3).map((cls) => (
                <span key={cls.code}>
                  <b>{cls.code}</b> {cls.available} seats
                </span>
              ))}
            </div>
            {index < option.legs.length - 1 && (
              <div className="transfer">
                <CheckCircle2 size={17} />
                <span>
                  <b>
                    {duration(option.transferMinutes)} transfer at{" "}
                    {stationNames[leg.to]}
                  </b>
                  <small>
                    Includes a {leg.punctuality.p90DelayMinutes} min delay buffer ·{" "}
                    {option.reliability.rating} reliability
                  </small>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="journey-action">
        <span>
          <IndianRupee size={16} />
          From <b>{option.fareFrom.toLocaleString("en-IN")}</b>
        </span>
        <Link to={`/booking/${option.id}`}>
          Select journey <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export default function JourneyResultsPage() {
  const [params] = useSearchParams();
  const [data, setData] = useState<JourneyAnalysis | null>(null);
  const [error, setError] = useState("");
  const from = params.get("from") || "HWH",
    to = params.get("to") || "MYS",
    date = params.get("date") || "2026-08-25";
  useEffect(() => {
    analyseJourney({ from, to, date, passengers: 1, sortBy: "balanced" })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [from, to, date]);
  return (
    <main className="results-page">
      <header className="results-header">
        <Link to="/" className="back">
          <ArrowLeft size={17} />
          Modify search
        </Link>
        <div>
          <h1>
            {stationNames[from] || from} <ArrowRight size={20} />{" "}
            {stationNames[to] || to}
          </h1>
          <p className="journey-date">
            <CalendarDays size={14} />
            {new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(
              new Date(`${date}T12:00:00`)
            )}
          </p>
        </div>
      </header>
      <section className="results-layout">
        <aside className="filters">
          <h2>Refine results</h2>
          <label>
            Sort results
            <select>
              <option>Best for your journey</option>
              <option>Fastest</option>
              <option>Lowest fare</option>
            </select>
          </label>
          <fieldset>
            <legend>Journey type</legend>
            <label>
              <input type="checkbox" defaultChecked /> Direct trains
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Connections
            </label>
          </fieldset>
          <fieldset>
            <legend>Travel class</legend>
            {["First AC", "Second AC", "Third AC", "Sleeper"].map((item) => (
              <label key={item}>
                <input type="checkbox" defaultChecked />
                {item}
              </label>
            ))}
          </fieldset>
          <div className="filter-note">
            {/* <ShieldCheck size={19} /> */}
            Connection options include station-change and delay-aware buffer checks.
          </div>
        </aside>
        <section className="journeys">
          <p className="insight">
            {data?.insight ||
              (error
                ? error
                : "Analysing the best direct and connecting train journeys…")}
          </p>
          {error && (
            <Link className="retry" to="/">
              Return to search
            </Link>
          )}
          {data?.options.map((option) => (
            <JourneyCard key={option.id} option={option} />
          ))}
        </section>
      </section>
    </main>
  );
}
