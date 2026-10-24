
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";
import StudentPage from "./pages/StudentPage.jsx";
import StaffPage from "./pages/StaffPage.jsx";
import MessAdmin from "./pages/MessAdmin.jsx";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/student" element={<StudentPage />} />
      <Route path="/staff" element={<StaffPage />} />
      <Route path="/mess-admin" element={<MessAdmin />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
