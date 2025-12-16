import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Toolbar, Container } from "@mui/material";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import AdminProfile from "./pages/profile/AdminProfile.jsx";

import UserList from "./pages/users/UserList.jsx";
import AdminSettingsPage from "./pages/settings/AdminSettingsPage.jsx";
import AccessControl from "./pages/access/AccessControl.jsx";

import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import Surface from "./components/ui/Surface.jsx";
import useAuth from "./hooks/useAuth";

function Shell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <Sidebar />
      <Topbar />
      <Toolbar sx={{ minHeight: 72 }} />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Surface>{children}</Surface>
      </Container>
    </Box>
  );
}

function CatchAllRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/admin" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={["ADMIN"]}>
            <Shell>
              <AdminDashboard />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRoles={["ADMIN"]}>
            <Shell>
              <UserList />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/access"
        element={
          <ProtectedRoute requiredRoles={["ADMIN"]}>
            <Shell>
              <AccessControl />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={["ADMIN"]}>
            <Shell>
              <AdminSettingsPage />
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Profile stays accessible from Topbar avatar menu */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Shell>
              <AdminProfile />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}
