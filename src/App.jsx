import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Portal         from "./pages/Portal";
import Dashboard      from "./pages/Dashboard";
import FXDashboard    from "./pages/FXDashboard";
import SavingsPlan    from "./pages/SavingsPlan";
import Login          from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Changelog      from "./pages/Changelog";

const SESSION_KEY = "okano-auth-session";

function RequireAuth({ children }) {
  if (sessionStorage.getItem(SESSION_KEY) === "true") return children;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 認証不要ページ */}
        <Route path="/login"           element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* 認証必要ページ */}
        <Route path="/"            element={<RequireAuth><Portal /></RequireAuth>} />
        <Route path="/dashboard"   element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/fx"          element={<RequireAuth><FXDashboard /></RequireAuth>} />
        <Route path="/savings"     element={<RequireAuth><SavingsPlan /></RequireAuth>} />
        <Route path="/changelog"   element={<RequireAuth><Changelog /></RequireAuth>} />
        {/* 今後のアプリ */}
        {/* <Route path="/education" element={<RequireAuth><Education /></RequireAuth>} /> */}
      </Routes>
    </BrowserRouter>
  );
}
