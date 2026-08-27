import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Hotel,
  MapPin,
  Menu,
  MessageCircle,
  Plane,
  Search,
  Send,
  Ticket,
  TrainFront,
  UtensilsCrossed,
  X,
} from "lucide-react";
import "./HomePage.css";
import english from "../locales/english.json";
import hindi from "../locales/hindi.json";
type Tab = "book" | "pnr" | "charts";
const stations = [
  "New Delhi",
  "Mumbai Central",
  "Howrah Junction",
  "Chennai Central",
  "Bengaluru",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Pune",
  "Patna",
];
const classes = [
  "All Classes",
  "Anubhuti Class",
  "AC First Class",
  "AC 2 Tier",
  "AC 3 Tier",
  "AC Chair Car",
  "Executive Chair Car",
  "Sleeper",
  "Second Sitting",
];
const quotas = [
  "GENERAL",
  "LADIES",
  "LOWER BERTH/SR.CITIZEN",
  "PERSON WITH DISABILITY",
  "DUTY PASS",
  "TATKAL",
  "PREMIUM TATKAL",
];

const navDropdowns: Record<string, string[]> = {
  TRAINS: ["Book Ticket", "PNR Enquiry", "Train Schedule", "Live Train Status"],
  "OTHER SERVICES": [
    "Retiring Rooms",
    "Railway Lounges",
    "Charter Trains",
    "Travel Insurance",
  ],
};

function installUtilityControls() {
  const utility = document.querySelector<HTMLElement>(".utility");
  const navigation = document.querySelector<HTMLElement>(".nav nav");
  if (!utility || !navigation || utility.dataset.enhanced) return;
  utility.dataset.enhanced = "true";
  const [clockArea, controls] = Array.from(
    utility.querySelectorAll<HTMLElement>("span")
  );
  const clock = document.createElement("time");
  clock.className = "live-clock";
  clockArea.replaceChildren(clock);
  const updateClock = () => {
    clock.dateTime = new Date().toISOString();
    clock.textContent = new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 1000);
  controls.innerHTML =
    '<button type="button" data-zoom="-">A-</button><button type="button" data-zoom="reset">A</button><button type="button" data-zoom="+">A+</button><button type="button" data-language>हिंदी</button>';
  let zoom = 100;
  let useHindi = false;
  const updateLanguage = () => {
    const dictionary = useHindi ? hindi : english;
    document.documentElement.lang = useHindi ? "hi" : "en";
    controls.querySelector<HTMLButtonElement>("[data-language]")!.textContent =
      dictionary.language;
    document.querySelectorAll<HTMLElement>("[data-label]").forEach((node) => {
      const key = node.dataset.label as keyof typeof english;
      node.textContent = dictionary[key];
    });
    const labels: Array<keyof typeof english> = [
      "bookTicket",
      "pnrStatus",
      "chartsVacancy",
      "indianRailways",
      "safety",
      "security",
      "punctuality",
    ];
    const from = useHindi ? english : hindi;
    const to = dictionary;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const key = labels.find((label) => node?.nodeValue?.trim() === from[label]);
      if (key && node.nodeValue)
        node.nodeValue = node.nodeValue.replace(from[key], to[key]);
    }
  };
  controls.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!button) return;
    if (button.dataset.language !== undefined) {
      useHindi = !useHindi;
      updateLanguage();
      return;
    }
    zoom =
      button.dataset.zoom === "+"
        ? Math.min(125, zoom + 10)
        : button.dataset.zoom === "-"
          ? Math.max(80, zoom - 10)
          : 100;
    document.documentElement.style.fontSize = `${zoom}%`;
  });
  navigation.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const items = navDropdowns[link.childNodes[0]?.textContent?.trim() ?? ""];
    if (!items) return;
    link.classList.add("has-menu");
    const menu = document.createElement("div");
    menu.className = "nav-dropdown";
    menu.setAttribute("role", "menu");
    items.forEach((item) => {
      const option = document.createElement("a");
      option.href = "#services";
      option.textContent = item;
      option.setAttribute("role", "menuitem");
      menu.append(option);
    });
    link.append(menu);
  });
}
function Station({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(
    () => stations.filter((s) => s.toLowerCase().includes(value.toLowerCase())),
    [value]
  );
  return (
    <label className="station">
      <span>
        <MapPin size={17} />
        {label}
      </span>
      <input
        value={value}
        placeholder={label}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && value && (
        <div className="suggestions">
          {matches.map((s) => (
            <button
              type="button"
              key={s}
              onMouseDown={() => {
                onChange(s);
                setOpen(false);
              }}
            >
              <MapPin size={14} />
              {s}
            </button>
          ))}
          {!matches.length && <p>No matching station</p>}
        </div>
      )}
    </label>
  );
}
function Booking() {
  const [tab, setTab] = useState<Tab>("book");
  const [from, setFrom] = useState("New Delhi");
  const [to, setTo] = useState("Mumbai Central");
  const [result, setResult] = useState("");
  const show = (type: string) => {
    setResult("loading");
    setTimeout(() => setResult(type), 600);
  };
  const reset = (t: Tab) => {
    setTab(t);
    setResult("");
  };
  return (
    <section className="booking">
      <div className="tabs">
        <button
          className={tab === "book" ? "active" : ""}
          onClick={() => reset("book")}
        >
          <Ticket size={17} />
          BOOK TICKET
        </button>
        <button className={tab === "pnr" ? "active" : ""} onClick={() => reset("pnr")}>
          PNR STATUS
        </button>
        <button
          className={tab === "charts" ? "active" : ""}
          onClick={() => reset("charts")}
        >
          CHARTS / VACANCY
        </button>
      </div>
      {tab === "book" && (
        <form
          className="booking-body"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (from && to) show("trains");
          }}
        >
          <h2>Book your journey</h2>
          <p>Search and reserve train tickets across India.</p>
          <div className="route">
            <Station label="From" value={from} onChange={setFrom} />
            <button
              className="swap"
              type="button"
              onClick={() => {
                const a = from;
                setFrom(to);
                setTo(a);
              }}
              aria-label="Swap stations"
            >
              <ArrowLeftRight size={18} />
            </button>
            <Station label="To" value={to} onChange={setTo} />
          </div>
          <div className="fields">
            <label>
              <span>
                <CalendarDays size={16} />
                Journey date
              </span>
              <input required type="date" defaultValue="2026-08-25" />
            </label>
            <label>
              <span>Class</span>
              <select>
                {classes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Quota</span>
              <select>
                {quotas.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="options">
            <label>
              <input type="checkbox" /> Person With Disability Concession
            </label>
            <label>
              <input type="checkbox" /> Flexible With Date
            </label>
            <label>
              <input type="checkbox" /> Railway Pass Concession
            </label>
          </div>
          <button className="primary" disabled={result === "loading"}>
            {result === "loading" ? "Searching trains…" : "Search Trains"}
            <Search size={17} />
          </button>
          {result === "trains" && (
            <div className="result">
              <b>3 trains found</b>
              <span>12952 Mumbai Rajdhani · 16:35 — 08:35 · AC 3 Tier available</span>
            </div>
          )}
        </form>
      )}
      {tab === "pnr" && (
        <form
          className="alternate"
          onSubmit={(e) => {
            e.preventDefault();
            show("pnr");
          }}
        >
          <h2>PNR Status</h2>
          <p>Enter your 10-digit PNR number to view reservation status.</p>
          <label>
            <span>PNR Number</span>
            <input
              required
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="Enter PNR Number"
            />
          </label>
          <button className="primary">Check Status</button>
          {result === "pnr" && (
            <div className="result">
              <b>12952 · Mumbai Rajdhani</b>
              <span>New Delhi → Mumbai Central · 25 Aug 2026</span>
              <span>Passenger 1 · B2 / 41 · Confirmed</span>
            </div>
          )}
        </form>
      )}
      {tab === "charts" && (
        <form
          className="alternate"
          onSubmit={(e) => {
            e.preventDefault();
            show("chart");
          }}
        >
          <h2>Charts / Vacancy</h2>
          <div className="fields chart">
            <label>
              <span>Train Number / Name</span>
              <input required placeholder="e.g. 12952" />
            </label>
            <label>
              <span>Journey Date</span>
              <input required type="date" defaultValue="2026-08-25" />
            </label>
            <label>
              <span>Boarding Station</span>
              <input required placeholder="Select station" />
            </label>
            <label>
              <span>Class</span>
              <select>
                {classes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary">Search</button>
          {result === "chart" && (
            <div className="result">
              <b>Availability found</b>
              <span>AC 3 Tier · 17 berths available · Chart not prepared</span>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
const services = [
  ["Flights", Plane],
  ["Hotels", Hotel],
  ["Rail Drishti", TrainFront],
  ["E-Catering", UtensilsCrossed],
  ["Bus", Ticket],
  ["Holiday Packages", CalendarDays],
  ["Tourist Train", TrainFront],
  ["Hill Railways", MapPin],
];
const holidays = [
  [
    "Maharajas’ Express",
    "A journey of royalty, luxury and comfort through the storied splendour of princely India.",
    "royal",
  ],
  [
    "International Packages",
    "Handpicked holidays to Thailand, Dubai, Sri Lanka, Europe, Australia and beyond.",
    "world",
  ],
  [
    "Domestic Air Packages",
    "Discover spiritual escapes, mountain trails, serene lakes and India’s remarkable coasts.",
    "domestic",
  ],
  [
    "Bharat Gaurav Tourist Train",
    "Themed rail journeys that celebrate India’s unique heritage and cultural destinations.",
    "heritage",
  ],
  [
    "Rail Tour Packages",
    "Confirmed tickets, sightseeing and meals for enchanting mountain and divine tours.",
    "rail",
  ],
];
export default function HomePage() {
  const [menu, setMenu] = useState(false),
    [chat, setChat] = useState(false);
  window.setTimeout(installUtilityControls, 0);
  return (
    <main>
      <header>
        <div className="utility">
          <span>
            Tue, 25 Aug 2026 · <Clock3 size={13} /> 11:32 AM
          </span>
          <span>
            A- &nbsp; A &nbsp; A+ &nbsp; <b>हिंदी</b>
          </span>
        </div>
        <div className="nav">
          <a className="brand" href="#top">
            <b>☸</b>
            <span>
              INDIAN
              <br />
              RAILWAYS
            </span>
          </a>
          <button className="menu" onClick={() => setMenu(!menu)}>
            {menu ? <X /> : <Menu />}
          </button>
          <nav className={menu ? "open" : ""}>
            {[
              "LOGIN / REGISTER",
              "TRAINS",
              "MEALS",
              "Upto 10% Cashback",
              "E-WALLET",
              "ALERTS",
              "OTHER SERVICES",
              "CONTACT US",
            ].map((x, i) => (
              <a
                key={x}
                className={i === 1 ? "selected" : ""}
                href={i === 1 ? "#booking" : "#services"}
              >
                {x}
                {(i === 1 || i === 6) && <ChevronDown size={12} />}
              </a>
            ))}
          </nav>
          <a className="irctc">
            IRCTC<small>Indian Railway Catering & Tourism</small>
          </a>
        </div>
      </header>
      <section id="top" className="hero">
        <div className="hero-text">
          <span>INDIAN RAILWAYS</span>
          <h1>
            Safety <i /> Security <i /> Punctuality
          </h1>
        </div>
        <div id="booking">
          <Booking />
        </div>
      </section>
      <section id="services" className="section services">
        <div className="heading">
          <span>EXPLORE IRCTC</span>
          <h2>Everything for the way you travel</h2>
        </div>
        <div className="services-grid">
          {services.map(([name, Icon]) => {
            const C = Icon as typeof Plane;
            return (
              <button key={name as string}>
                <C />
                <b>{name as string}</b>
                <ChevronDown size={13} />
              </button>
            );
          })}
        </div>
      </section>
      <section className="section holidays">
        <div className="heading">
          <span>HOLIDAYS</span>
          <h2>Travel beyond the destination</h2>
          <p>Thoughtful journeys with every detail taken care of.</p>
        </div>
        <div className="holiday-grid">
          {holidays.map(([title, copy, style]) => (
            <article className={style} key={title}>
              <div className="image">IRCTC HOLIDAYS</div>
              <div className="holiday-copy">
                <h3>{title}</h3>
                <p>{copy}</p>
                <button>Read More →</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="social">
        <p>Get Connected with us on social networks</p>
        <div>
          {[MessageCircle, Send, CircleHelp, Ticket, MapPin, TrainFront].map((I, i) => (
            <a href="#top" key={i}>
              <I />
            </a>
          ))}
        </div>
      </section>
      <footer>
        <div className="footer-main">
          {[
            [
              "IRCTC Trains",
              "General Information",
              "Important Information",
              "Agents",
              "Enquiries",
            ],
            [
              "How To",
              "IRCTC Official App",
              "Advertise with us",
              "Refund Rules",
              "Person With Disability Facilities",
            ],
            [
              "E-Wallet",
              "IRCTC Co-branded Card Benefits",
              "IRCTC-iPAY Payment Gateway",
              "IRCTC Zone",
              "DMRC Ticket Booking at IRCTC",
            ],
            [
              "For Newly Migrated Agents",
              "Mobile Zone",
              "Policies",
              "Ask Disha ChatBot",
              "About us",
            ],
            ["Help & Support", "E-Pantry"],
          ].map((col, i) => (
            <div key={i}>
              {col.map((x) => (
                <a href="#top" key={x}>
                  {x}
                  <ChevronDown size={12} />
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="bottom">
          <div className="certs">
            <b>VERISIGN</b>
            <b>
              Mastercard
              <br />
              SecureCode
            </b>
            <b>
              American Express
              <br />
              SafeKey
            </b>
            <b>VISA</b>
            <b>RuPay</b>
            <b>IRCTC</b>
            <b>CRIS</b>
          </div>
          <p>
            Copyright © 2026 - <a href="http://www.irctc.co.in">www.irctc.co.in</a>. All
            Rights Reserved · Designed and Hosted by CRIS · Compatible Browsers
          </p>
        </div>
      </footer>
      <div className="chat">
        {chat && (
          <div className="window">
            <button onClick={() => setChat(false)}>
              <X size={16} />
            </button>
            <b>Hi, I’m AskDisha</b>
            <p>How can I help you plan your train journey?</p>
            <a>Book Train Ticket</a>
            <div>
              Type a message <Send size={14} />
            </div>
          </div>
        )}
        <button className="ask" onClick={() => setChat(!chat)}>
          <MessageCircle />
          <span>
            <b>AskDisha 2.0</b>
            <small>Book Train Ticket</small>
          </span>
        </button>
      </div>
    </main>
  );
}
