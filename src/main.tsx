import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./radix-ui-fix.css";

createRoot(document.getElementById("root")!).render(<App />);
