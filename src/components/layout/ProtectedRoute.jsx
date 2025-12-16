import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Spinner from "../ui/Spinner";
import { hasRole } from "../../utils/permissions";

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  // If roles are required, block when user role isn't allowed
  if (requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
    return (
      <div style={{ padding: 24, color: "white" }}>
        <h2>You don’t have permission to view this page.</h2>
        <p>
          Logged in as: {user?.email} ({user?.role})
        </p>
      </div>
    );
  }

  return children;
}
