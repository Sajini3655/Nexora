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
    if (moduleAccess.PROJECTS) return "/manager/projects";
    if (moduleAccess.TASKS) return "/manager/ai-assignment";
    return "/users";
  }

  if (r === "DEVELOPER") {
    if (moduleAccess.DASHBOARD) return "/dev";
    if (moduleAccess.TASKS) return "/dev/tasks";
    if (moduleAccess.CHAT) return "/dev/chat";
    if (moduleAccess.PROJECTS) return "/dev/projects";
    return "/dev/profile";
  }

  if (r === "CLIENT") {
    if (moduleAccess.DASHBOARD) return "/client";
    if (moduleAccess.TICKETS) return "/client/tickets";
    if (moduleAccess.PROJECTS) return "/client/projects";
    return "/client/profile";
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
    // requiredModule may be a single module key or an array of keys (any-of).
    const required = Array.isArray(requiredModule) ? requiredModule : [requiredModule];
    const allowed = required.some((module) => Boolean(moduleAccess?.[module]));
    if (!allowed) {
      return <Navigate to={roleHome(activeRole, moduleAccess || {})} replace />;
    }
  }

  return <Outlet />;
}


