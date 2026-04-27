import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={22} />
          <Typography>Checking session...</Typography>
        </Box>
      </Box>
    );
  }

  if (user) {
    // Already logged in → redirect to dashboard
    return <Navigate to="/" />;
  }

  return children;
};

export default PublicRoute;

