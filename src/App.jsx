import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portal    from "./pages/Portal";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Portal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* 今後のアプリをここに追加 */}
        {/* <Route path="/fx"         element={<FxTracker />} /> */}
        {/* <Route path="/education"  element={<Education />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
