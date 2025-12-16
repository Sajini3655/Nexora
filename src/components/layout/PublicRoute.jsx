import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // Already logged in → redirect to dashboard
    return <Navigate to="/" />;
  }

  return children;
};

export default PublicRoute;
