import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import JourneyResultsPage from "./pages/JourneyResultsPage";
import SearchRoute from "./pages/SearchRoute";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchRoute />} />
        <Route path="/journeys" element={<JourneyResultsPage />} />
        <Route path="/booking/:journeyId" element={<JourneyResultsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
