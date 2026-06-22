/**
 * ============================================================================
 * APP.TSX - Root Component
 * ============================================================================
 *
 * This is the main component of the application.
 * Right now it's very simple - it just renders the RouteViewer page.
 *
 * 📚 FUTURE EXPANSION:
 * If you want to add:
 * - Multiple pages → Use React Router here
 * - Global state → Wrap with Context Providers here
 * - Authentication → Add auth checks here
 * - Navigation → Add a navbar component here
 *
 * 💡 WHY IT'S SEPARATE FROM MAIN.TSX:
 * - main.tsx handles the React→HTML connection
 * - App.tsx handles the application structure
 * - This separation keeps concerns organized
 */

import RouteViewer from "./pages/RouteViewer";

function App() {
  // For now, we just render the main page
  // In the future, you could add routing like:
  // <BrowserRouter>
  //   <Routes>
  //     <Route path="/" element={<RouteViewer />} />
  //     <Route path="/settings" element={<Settings />} />
  //   </Routes>
  // </BrowserRouter>
  return <RouteViewer />;
}

export default App;
