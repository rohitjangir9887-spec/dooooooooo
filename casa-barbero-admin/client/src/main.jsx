import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./assets/styles/global.css";
import "./assets/styles/buttons.css";
import "./assets/styles/forms.css";
import "./assets/styles/layout.css";
import "./assets/styles/ui.css";
import "./assets/styles/errors.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
