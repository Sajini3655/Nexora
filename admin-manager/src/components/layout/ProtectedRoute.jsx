// src/components/layout/ProtectedRoute.jsx
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasAnyRole } from "../../utils/permissions";
import { getActiveRole } from "../../utils/roleRouting";

function roleFromPathname(pathname) {
  const path = String(pathname || "");
  if (path.startsWith("/dev")) return "DEVELOPER";
  if (path.startsWith("/client")) return "CLIENT";
  if (path.startsWith("/manager")) return "MANAGER";
  if (path.startsWith("/admin") || path === "/access" || path === "/settings") return "ADMIN";
  if (path.startsWith("/admin/")) return "ADMIN";
  return "";
}

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
    if (moduleAccess.CHAT) return "/dev/chat";
    if (moduleAccess.FILES) return "/dev/projects";
    return "/dev/profile";
  }

  return "/login";
}

export default function ProtectedRoute({ allowedRoles, requiredModule }) {
  const { user, loading, moduleAccess, accessLoading } = useAuth();
  const location = useLocation();
  const activeRole = roleFromPathname(location.pathname) || getActiveRole(user) || user?.role;

  if (loading || accessLoading) {
    return (
      <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={22} />
          <Typography>Checking session...</Typography>
        </Box>
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !hasAnyRole(user, allowedRoles)) {
    return <Navigate to="/login" replace />;
  }

  if (requiredModule && String(activeRole || "").toUpperCase() !== "ADMIN") {
    const allowed = Boolean(moduleAccess?.[requiredModule]);
    if (!allowed) {
      return <Navigate to={roleHome(activeRole, moduleAccess || {})} replace />;
    }
  }

  return <Outlet />;
}

