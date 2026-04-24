// src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function roleHome(role, moduleAccess = {}) {
  const r = (role || "").toUpperCase();
  if (r === "ADMIN") return "/admin";

  if (r === "MANAGER") {
    if (moduleAccess.DASHBOARD) return "/manager";
    if (moduleAccess.FILES) return "/manager/projects";
    if (moduleAccess.TASKS) return "/manager/ai-assignment";
    return "/users";
  }

  if (r === "DEVELOPER") {
    if (moduleAccess.DASHBOARD) return "/dev";
    if (moduleAccess.TASKS) return "/dev/tasks";
    if (moduleAccess.CHAT) return "/dev/chat/P-001";
    if (moduleAccess.FILES) return "/dev/projects";
    return "/dev/profile";
  }

  return "/login";
}

export default function ProtectedRoute({ allowedRoles, requiredModule }) {
  const { user, loading, moduleAccess, accessLoading } = useAuth();

  if (loading || accessLoading) {
    return <div style={{ textAlign: "center", marginTop: 100 }}>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  if (requiredModule && user.role !== "ADMIN") {
    const allowed = Boolean(moduleAccess?.[requiredModule]);
    if (!allowed) {
      return <Navigate to={roleHome(user.role, moduleAccess || {})} replace />;
    }
  }

  return <Outlet />;
}
