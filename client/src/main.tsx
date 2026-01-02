import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Supprimé: Service Worker support (tout passe par serveur PostgreSQL)


createRoot(document.getElementById("root")!).render(<App />);
