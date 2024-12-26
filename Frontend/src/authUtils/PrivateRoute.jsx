/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isValidToken, refreshAccessToken } from "./authUtils";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      let token = localStorage.getItem("accessToken");

      if (!isValidToken(token)) {
        token = await refreshAccessToken();
      }

      setIsAuthenticated(token !== null);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
