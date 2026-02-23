import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // <- make sure this exists

// If the Admin/Manager login redirects here with ?token=..., store it.
// This keeps a single shared backend token across all dashboards.
try {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");
  if (token) {
    localStorage.setItem("token", token);
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
  }
} catch {
  // ignore
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
