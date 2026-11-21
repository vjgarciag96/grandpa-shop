import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("The page is missing the root element");
}

createRoot(rootElement).render(<StrictMode />);
