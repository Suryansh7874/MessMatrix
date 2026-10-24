
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api.js";

const dashboardPaths = {
  STUDENT: "/student",
  MESS_STAFF: "/staff",
  MESS_ADMIN: "/mess-admin",
};

export default function ProtectedRoute({ allowedRole, children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        if (active) setStatus("unauthenticated");
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (active) {
          setUser(response.data.user);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!active) return;

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    }

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <p style={{ padding: "24px" }}>Verifying your session...</p>;
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (status === "error") {
    return (
      <main style={{ padding: "24px" }}>
        <h2>Unable to verify your session</h2>
        <p>Check that the backend is running, then try again.</p>
        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    );
  }

  if (!user || !dashboardPaths[user.role]) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={dashboardPaths[user.role]}
        replace
      />
    );
  }

  return children;
}
