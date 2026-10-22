import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login.jsx";
import Register from "./Register.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;