import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function useAuthGuard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [auth.isAuthenticated, location.pathname, navigate]);

  return auth;
}
