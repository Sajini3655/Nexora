import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import AdminDashboard from "./pages/dashboard/AdminDashboard.jsx";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard.jsx";
import ProjectList from "./pages/projects/ProjectList.jsx";
import ProjectDetails from "./pages/projects/ProjectDetails.jsx";
import ProjectManagement from "./pages/projects/ProjectManagement.jsx";
import ProjectManagementDetails from "./pages/projects/ProjectManagementDetails.jsx";
import AddProject from "./pages/projects/AddProject.jsx";
import UserList from "./pages/users/UserList.jsx";
import AdminProfile from "./pages/profile/AdminProfile.jsx";
import AdminSettingsPage from "./pages/settings/AdminSettingsPage.jsx";
import AccessControl from "./pages/access/AccessControl.jsx";

// Layout Components
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ManagerSidebar from "./components/layout/ManagerSidebar.jsx";
import ManagerTopbar from "./components/layout/ManagerTopbar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import Surface from "./components/ui/Surface.jsx";

// Auth
import { useAuth } from "./context/AuthContext.jsx";


// ================= ADMIN SHELL =================
function AdminShell({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Topbar />
        <div style={{ minHeight: 72 }} />
        <Surface>{children}</Surface>
      </div>
    </div>
  );
}


// ================= MANAGER SHELL =================
function ManagerShell({ children }) {
  const [open, setOpen] = React.useState(false);
  const handleToggle = () => setOpen(prev => !prev);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ManagerSidebar open={open} onClose={() => setOpen(false)} />
      <div style={{ flex: 1 }}>
        <ManagerTopbar onMenuClick={handleToggle} />
        <div style={{ minHeight: 72 }} />
        <Surface>{children}</Surface>
      </div>
    </div>
  );
}


// ================= ROLE SHELL =================
function RoleShell({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toUpperCase();

  return role === "ADMIN"
    ? <AdminShell>{children}</AdminShell>
    : <ManagerShell>{children}</ManagerShell>;
}


// ================= APP ROUTES =================
export default function App() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route
          path="/admin"
          element={<AdminShell><AdminDashboard /></AdminShell>}
        />
        <Route
          path="/access"
          element={<AdminShell><AccessControl /></AdminShell>}
        />
        <Route
          path="/settings"
          element={<AdminShell><AdminSettingsPage /></AdminShell>}
        />
      </Route>

      {/* MANAGER ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
        <Route
          path="/manager"
          element={<ManagerShell><ManagerDashboard /></ManagerShell>}
        />
        <Route
          path="/manager/projects"
          element={<ManagerShell><ProjectList /></ManagerShell>}
        />
        <Route
          path="/manager/projects/:projectId"
          element={<ManagerShell><ProjectDetails /></ManagerShell>}
        />
        <Route
          path="/manager/project-management"
          element={<ManagerShell><ProjectManagement /></ManagerShell>}
        />
        <Route
          path="/manager/project-management/:projectId"
          element={<ManagerShell><ProjectManagementDetails /></ManagerShell>}
        />
        <Route
          path="/manager/add-project"
          element={<ManagerShell><AddProject /></ManagerShell>}
        />
      </Route>

      {/* SHARED ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]} />}>
        <Route
          path="/users"
          element={<RoleShell><UserList /></RoleShell>}
        />
        <Route
          path="/profile"
          element={<RoleShell><AdminProfile /></RoleShell>}
        />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
