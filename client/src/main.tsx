import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import JourneyResultsPage from "./pages/JourneyResultsPage";
import BookingPage from "./pages/BookingPage";
import PassengerPage from "./pages/PassengerPage";
import PaymentPage from "./pages/PaymentPage";
import BookingRedirect from "./pages/BookingRedirect";
import SearchRoute from "./pages/SearchRoute";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchRoute />} />
        <Route path="/journeys" element={<JourneyResultsPage />} />
        <Route path="/booking/:bookingId" element={<BookingRedirect />} />
        <Route path="/booking/:bookingId/passengers" element={<PassengerPage />} />
        <Route path="/booking/:bookingId/seats" element={<BookingPage />} />
        <Route path="/booking/:bookingId/payment" element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
