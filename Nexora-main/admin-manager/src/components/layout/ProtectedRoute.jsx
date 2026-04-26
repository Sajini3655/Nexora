// src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles, moduleKey }) {
  const { user, hasPermission } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const roleAllowed = allowedRoles.includes(user.role);
    if (!roleAllowed) {
      if (!moduleKey || !hasPermission(moduleKey)) {
        return <Navigate to="/login" replace />;
      }
    }
  } else if (moduleKey && !hasPermission(moduleKey)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
