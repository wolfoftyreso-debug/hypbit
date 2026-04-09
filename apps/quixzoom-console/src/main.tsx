import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/translations"; // Register all translations

createRoot(document.getElementById("root")!).render(<App />);
