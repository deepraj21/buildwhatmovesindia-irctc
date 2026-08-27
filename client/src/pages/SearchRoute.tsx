import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import HomePage from "./HomePage";

const stationCodes: Record<string, string> = {
  Bengaluru: "SBC",
  "Howrah Junction": "HWH",
  "KSR Bengaluru": "SBC",
  "Mumbai Central": "MMCT",
  "Mysuru Junction": "MYS",
  "New Delhi": "NDLS",
};

export default function SearchRoute() {
  const navigate = useNavigate();

  function handleSearch(event: FormEvent<HTMLDivElement>) {
    const form = event.target as HTMLFormElement;

    if (!form.classList.contains("booking-body")) return;

    const inputs = Array.from(
      form.querySelectorAll<HTMLInputElement>(".station input")
    );
    const date =
      form.querySelector<HTMLInputElement>('input[type="date"]')?.value ?? "2026-08-25";
    const from = stationCodes[inputs[0]?.value] ?? "HWH";
    const to = stationCodes[inputs[1]?.value] ?? "MYS";

    navigate(`/journeys?from=${from}&to=${to}&date=${date}`);
  }

  return (
    <div onSubmitCapture={handleSearch}>
      <HomePage />
    </div>
  );
}
