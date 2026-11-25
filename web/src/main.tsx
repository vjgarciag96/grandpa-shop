import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { httpCatalogue } from "./httpCatalogue";
import { applyTokens } from "./tokens";
import "./styles.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("The page is missing the root element");
}

applyTokens(document.documentElement);

createRoot(rootElement).render(
  <StrictMode>
    <App catalogue={httpCatalogue} />
  </StrictMode>,
);
