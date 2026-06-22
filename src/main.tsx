/**
 * ============================================================================
 * MAIN.TSX - Entry Point of the Application
 * ============================================================================
 *
 * This is the FIRST file that runs when your app starts.
 * It's responsible for:
 * 1. Connecting React to the HTML (finding the #root div)
 * 2. Rendering the main <App /> component
 * 3. Enabling StrictMode for development warnings
 * 4. Loading global styles and scripts
 *
 * 📚 LEARNING POINTS:
 * - React 18 uses createRoot() instead of the old ReactDOM.render()
 * - StrictMode helps catch bugs during development
 * - The "!" after getElementById tells TypeScript "I'm sure this element exists"
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/global.css";

// Find the HTML element with id="root" in public/index.html
// and render our React app inside it
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
