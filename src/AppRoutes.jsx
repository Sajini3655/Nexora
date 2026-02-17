// src/AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import ManagerShell from "./components/layout/ManagerShell.jsx";
import RoleShell from "./components/layout/RoleShell.jsx";
import UserList from "./pages/users/UserList.jsx";
import AdminProfile from "./pages/profile/AdminProfile.jsx";
import AdminSettingsPage from "./pages/settings/AdminSettingsPage.jsx";
import AccessControl from "./pages/access/AccessControl.jsx";
import ProjectList from "./pages/projects/ProjectList.jsx";
import ProjectDetails from "./pages/projects/ProjectDetails.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminShell><AdminDashboard /></AdminShell>} />
        <Route path="/access" element={<AdminShell><AccessControl /></AdminShell>} />
        <Route path="/settings" element={<AdminShell><AdminSettingsPage /></AdminShell>} />
      </Route>

      {/* MANAGER ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
        <Route path="/manager" element={<ManagerShell><ManagerDashboard /></ManagerShell>} />
        <Route path="/manager/projects" element={<ManagerShell><ProjectList /></ManagerShell>} />
        <Route path="/manager/projects/:projectId" element={<ManagerShell><ProjectDetails /></ManagerShell>} />
      </Route>

      {/* SHARED ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN","MANAGER"]} />}>
        <Route path="/users" element={<RoleShell><UserList /></RoleShell>} />
        <Route path="/profile" element={<RoleShell><AdminProfile /></RoleShell>} />
      </Route>

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
