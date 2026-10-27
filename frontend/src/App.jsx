
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";
import StudentPage from "./pages/StudentPage.jsx";
import StaffPage from "./pages/StaffPage.jsx";
import MessAdmin from "./pages/MessAdmin.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ForgotPassword from "./pages/ForgotPassword";

import ResetPassword from "./pages/ResetPassword.jsx";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <StudentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRole="MESS_STAFF">
            <StaffPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mess-admin"
        element={
          <ProtectedRoute allowedRole="MESS_ADMIN">
            <MessAdmin />
          </ProtectedRoute>
        }
      />
<Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    
  );
}

export default App;
