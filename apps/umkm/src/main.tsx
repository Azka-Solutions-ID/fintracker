import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@sidp/tokens/tokens.css";
import "@sidp/ui/ui.css";
import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
