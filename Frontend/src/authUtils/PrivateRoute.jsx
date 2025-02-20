/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { isValidToken } from "./authUtils";
import { HashLoader } from "react-spinners";

const LoadingSpinner = () => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backdropFilter: "blur(4px)",
      transition: "opacity 0.3s ease-in-out",
      opacity: 1,
      zIndex: 1000,
    }}
  >
    <HashLoader color="#7e00ff" size={60} speedMultiplier={1.5} />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem("accessToken");
      let role = localStorage.getItem("userRole");

      if (!isValidToken(token)) {
        token = null;
        role = null;
      }

      setIsAuthenticated(token !== null);
      setUserRole(role);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    navigate(-1);
    return null;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem("accessToken");

      if (!isValidToken(token)) {
        token = null;
      }

      setIsAuthenticated(token !== null);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const RoleBasedRedirect = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem("accessToken");
      let role = localStorage.getItem("userRole");

      if (!isValidToken(token)) {
        token = null;
        role = null;
      }

      setIsAuthenticated(token !== null);
      setUserRole(role);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    switch (userRole) {
      case "admin":
        return <Navigate to="/adminDashboard" replace />;
      case "tutor":
        return <Navigate to="/tutorDashboard" replace />;
      case "user":
        return <Navigate to="/stdDashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

const ForgotPasswordRoute = ({ children }) => {
  const location = useLocation();
  const isFromLogin = location.state?.from === "/login";

  if (!isFromLogin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export { ProtectedRoute, PublicRoute, ForgotPasswordRoute, RoleBasedRedirect };
