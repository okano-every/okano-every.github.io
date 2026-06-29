import { BrowserRouter, Routes, Route } from "react-router-dom";
import Portal      from "./pages/Portal";
import Dashboard   from "./pages/Dashboard";
import FXDashboard from "./pages/FXDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Portal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fx"        element={<FXDashboard />} />
        {/* 今後のアプリをここに追加 */}
        {/* <Route path="/education" element={<Education />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
