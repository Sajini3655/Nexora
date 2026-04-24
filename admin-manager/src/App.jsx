import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import AdminDashboard from "./admin/pages/dashboard/AdminDashboard.jsx";
import AccessControl from "./admin/pages/access/AccessControl.jsx";
import AdminProfile from "./admin/pages/profile/AdminProfile.jsx";
import AdminSettingsPage from "./admin/pages/settings/AdminSettingsPage.jsx";
import UserList from "./admin/pages/users/UserList.jsx";

import ManagerDashboard from "./manager/pages/dashboard/ManagerDashboard.jsx";
import AddProject from "./manager/pages/projects/AddProject.jsx";
import ProjectDetails from "./manager/pages/projects/ProjectDetails.jsx";
import ProjectManagement from "./manager/pages/projects/ProjectManagement.jsx";
import ProjectManagementDetails from "./manager/pages/projects/ProjectManagementDetails.jsx";
import AIAssignment from "./manager/pages/ai/AIAssignment.jsx";

// Developer dashboard (merged from /developer)
import DevDashboardHome from "./dev/pages/dashboard/DevDashboardHome.jsx";
import DevWorkspace from "./dev/pages/workspace/DevWorkspace.jsx";
import DevTaskList from "./dev/pages/tasks/DevTaskList.jsx";
import DevTaskView from "./dev/pages/tasks/DevTaskView.jsx";
import DevTicketView from "./dev/pages/tickets/DevTicketView.jsx";
import DevTicketCreate from "./dev/pages/tickets/DevTicketCreate.jsx";
import DevProfile from "./dev/pages/profile/DevProfile.jsx";
import DevChat from "./dev/pages/chat/DevChat.jsx";
import DevProjectList from "./dev/pages/projects/DevProjectList.jsx";
import DevProjectView from "./dev/pages/projects/DevProjectView.jsx";
import DevSettings from "./dev/pages/settings/DevSettings.jsx";

// Client dashboard
import ClientDashboardHome from "./client/pages/dashboard/ClientDashboardHome.jsx";
import ClientProjectList from "./client/pages/projects/ClientProjectList.jsx";
import ClientTicketList from "./client/pages/tickets/ClientTicketList.jsx";
import ClientProfile from "./client/pages/profile/ClientProfile.jsx";
import ClientSettings from "./client/pages/settings/ClientSettings.jsx";

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

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} requiredModule="DASHBOARD" />}>
        <Route
          path="/manager"
          element={
            <ManagerShell>
              <ManagerDashboard />
            </ManagerShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} requiredModule="FILES" />}>
        <Route
          path="/manager/projects"
          element={
            <ManagerShell>
              <AddProject />
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
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} requiredModule="TASKS" />}>
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

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="DASHBOARD" />}>
        <Route path="/dev" element={<DevDashboardHome />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="FILES" />}>
        <Route path="/dev/project/:id" element={<DevWorkspace />} />

        <Route path="/dev/projects" element={<DevProjectList />} />
        <Route path="/dev/projects/:id" element={<DevProjectView />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="TASKS" />}>
        <Route path="/dev/tasks" element={<DevTaskList />} />
        <Route path="/dev/tasks/:id" element={<DevTaskView />} />

        <Route path="/dev/tickets/new" element={<DevTicketCreate />} />
        <Route path="/dev/tickets/:id" element={<DevTicketView />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} />}>

        <Route path="/dev/profile" element={<DevProfile />} />

        <Route path="/dev/settings" element={<DevSettings />} />

      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="CHAT" />}>

        <Route path="/dev/chat" element={<Navigate to="/dev/chat/P-001" replace />} />
        <Route path="/dev/chat/:projectId" element={<DevChat />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
        <Route path="/client" element={<ClientDashboardHome />} />
        <Route path="/client/projects" element={<ClientProjectList />} />
        <Route path="/client/tickets" element={<ClientTicketList />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/settings" element={<ClientSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}