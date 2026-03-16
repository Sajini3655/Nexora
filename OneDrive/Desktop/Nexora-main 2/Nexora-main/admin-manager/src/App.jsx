import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard.jsx";
import ProjectList from "./pages/projects/ProjectList.jsx";
import ProjectDetails from "./pages/projects/ProjectDetails.jsx";
import ProjectManagement from "./pages/projects/ProjectManagement.jsx";
import ProjectManagementDetails from "./pages/projects/ProjectManagementDetails.jsx";
import AddProject from "./pages/projects/AddProject.jsx";
import AIAssignment from "./pages/ai/AIAssignment.jsx";
import UserList from "./pages/users/UserList.jsx";
import AdminProfile from "./pages/profile/AdminProfile.jsx";
import AdminSettingsPage from "./pages/settings/AdminSettingsPage.jsx";
import AccessControl from "./pages/access/AccessControl.jsx";

import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ManagerSidebar from "./components/layout/ManagerSidebar.jsx";
import ManagerTopbar from "./components/layout/ManagerTopbar.jsx";
import Topbar from "./components/layout/Topbar.jsx";

import { useAuth } from "./context/AuthContext.jsx";

function AdminShell({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 18%), linear-gradient(180deg, #08101f 0%, #050b18 100%)",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar />
        <div style={{ minHeight: 72 }} />
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ManagerShell({ children }) {
  const [open, setOpen] = React.useState(false);
  const handleToggle = () => setOpen((prev) => !prev);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 18%), linear-gradient(180deg, #08101f 0%, #050b18 100%)",
      }}
    >
      <ManagerSidebar open={open} onClose={() => setOpen(false)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <ManagerTopbar onMenuClick={handleToggle} />
        <div style={{ minHeight: 72 }} />
        <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function RoleShell({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 100 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toUpperCase();

  return role === "ADMIN" ? (
    <AdminShell>{children}</AdminShell>
  ) : (
    <ManagerShell>{children}</ManagerShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/accept-invite" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route
          path="/admin"
          element={
            <AdminShell>
              <AdminDashboard />
            </AdminShell>
          }
        />
        <Route
          path="/access"
          element={
            <AdminShell>
              <AccessControl />
            </AdminShell>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminShell>
              <AdminSettingsPage />
            </AdminShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
        <Route
          path="/manager"
          element={
            <ManagerShell>
              <ManagerDashboard />
            </ManagerShell>
          }
        />
        <Route
          path="/manager/projects"
          element={
            <ManagerShell>
              <ProjectList />
            </ManagerShell>
          }
        />
        <Route
          path="/manager/projects/:projectId"
          element={
            <ManagerShell>
              <ProjectDetails />
            </ManagerShell>
          }
        />
        <Route
          path="/manager/project-management"
          element={
            <ManagerShell>
              <ProjectManagement />
            </ManagerShell>
          }
        />
        <Route
          path="/manager/project-management/:projectId"
          element={
            <ManagerShell>
              <ProjectManagementDetails />
            </ManagerShell>
          }
        />
        <Route
          path="/manager/add-project"
          element={
            <ManagerShell>
              <AddProject />
            </ManagerShell>
          }
        />
        <Route
          path="/manager/ai-assignment"
          element={
            <ManagerShell>
              <AIAssignment />
            </ManagerShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />}>
        <Route
          path="/users"
          element={
            <RoleShell>
              <UserList />
            </RoleShell>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleShell>
              <AdminProfile />
            </RoleShell>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}