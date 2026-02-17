// src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ textAlign: "center", marginTop: 100 }}>Loading...</div>;

  if (!user) return <Outlet />; // allow public pages (login/register) to render

  if (allowedRoles.length && !allowedRoles.includes(user.role.toUpperCase())) {
    // redirect to dashboard if role not allowed
    const role = user.role.toUpperCase();
    return <Navigate to={role === "ADMIN" ? "/admin" : "/manager"} replace />;
  }

  return <Outlet />; // allowed route
}
