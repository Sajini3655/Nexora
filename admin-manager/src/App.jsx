import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ChooseWorkspace from "./pages/auth/ChooseWorkspace.jsx";
import AdminDashboard from "./admin/pages/dashboard/AdminDashboard.jsx";
import AccessControl from "./admin/pages/access/AccessControl.jsx";
import AdminProfile from "./admin/pages/profile/AdminProfile.jsx";
import AdminSettingsPage from "./admin/pages/settings/AdminSettingsPage.jsx";
import UserList from "./admin/pages/users/UserList.jsx";
import AdminTimesheets from "./admin/pages/timesheets/AdminTimesheets.jsx";

import ManagerDashboard from "./manager/pages/dashboard/ManagerDashboard.jsx";
import AddProject from "./manager/pages/projects/AddProject.jsx";
import ProjectManagement from "./manager/pages/projects/ProjectManagement.jsx";
import ProjectManagementDetails from "./manager/pages/projects/ProjectManagementDetails.jsx";
import AIAssignment from "./manager/pages/ai/AIAssignment.jsx";
import ManagerTimesheets from "./manager/pages/timesheets/ManagerTimesheets.jsx";
import ManagerTickets from "./manager/pages/tickets/ManagerTickets.jsx";

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
import DevTimesheets from "./dev/pages/timesheets/DevTimesheets.jsx";

// Client dashboard
import ClientDashboardHome from "./client/pages/dashboard/ClientDashboardHome.jsx";
import ClientProjectList from "./client/pages/projects/ClientProjectList.jsx";
import ClientTicketList from "./client/pages/tickets/ClientTicketList.jsx";
import ClientProfile from "./client/pages/profile/ClientProfile.jsx";
import ClientSettings from "./client/pages/settings/ClientSettings.jsx";
import ClientHistory from "./client/pages/history/ClientHistory.jsx";

import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ManagerSidebar from "./components/layout/ManagerSidebar.jsx";
import DevSidebar from "./dev/components/layout/DevSidebar.jsx";
import ClientSidebar from "./client/components/layout/ClientSidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import { layoutGaps } from "./theme/layoutGaps.js";

import { useAuth } from "./context/AuthContext.jsx";
import { useLayout } from "./context/LayoutContext.jsx";

/**
 * Unified shell component for all roles (Admin, Manager, Developer, Client)
 * Uses consistent spacing from layoutGaps for visual alignment
 */
function UnifiedShell({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { openSidebar: adminOpenSidebar } = useLayout();

  // Determine which sidebar to render
  const renderSidebar = () => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return <Sidebar />;
      case "MANAGER":
        return <ManagerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case "DEVELOPER":
        return <DevSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      case "CLIENT":
        return <ClientSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
      default:
        return null;
    }
  };

  // Admin uses context for sidebar, others use state
  const handleMenuClick = role?.toUpperCase() === "ADMIN" ? adminOpenSidebar : () => setSidebarOpen(true);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(104,81,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(0,255,170,0.08), transparent 18%), linear-gradient(180deg, #08101f 0%, #050b18 100%)",
      }}
    >
      {renderSidebar()}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Topbar onMenuClick={handleMenuClick} />
        <div
          style={{
            padding: `${layoutGaps.adminManager.top}px ${layoutGaps.adminManager.side}px ${layoutGaps.adminManager.bottom}px`,
            maxWidth: `${layoutGaps.maxContentWidth}px`,
            margin: "0 auto",
          }}
        >
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

  return <UnifiedShell role={user.role}>{children}</UnifiedShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-workspace" element={<ChooseWorkspace />} />
      <Route path="/auth/accept-invite" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route
          path="/admin"
          element={
            <UnifiedShell role="ADMIN">
              <AdminDashboard />
            </UnifiedShell>
          }
        />
        <Route
          path="/access"
          element={
            <UnifiedShell role="ADMIN">
              <AccessControl />
            </UnifiedShell>
          }
        />
        <Route
          path="/settings"
          element={
            <UnifiedShell role="ADMIN">
              <AdminSettingsPage />
            </UnifiedShell>
          }
        />
        <Route
          path="/admin/timesheets"
          element={
            <UnifiedShell role="ADMIN">
              <AdminTimesheets />
            </UnifiedShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} requiredModule="DASHBOARD" />}>
        <Route
          path="/manager"
          element={
            <UnifiedShell role="MANAGER">
              <ManagerDashboard />
            </UnifiedShell>
          }
        />
      </Route>

       <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
         <Route
         path="/manager/tickets"
         element={
         <UnifiedShell role="MANAGER">
         <ManagerTickets />
         </UnifiedShell>
         }
       />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} requiredModule="FILES" />}>
        <Route
          path="/manager/projects"
          element={
            <UnifiedShell role="MANAGER">
              <ProjectManagement />
            </UnifiedShell>
          }
        />
        <Route
          path="/manager/projects/:projectId"
          element={
            <UnifiedShell role="MANAGER">
              <ProjectManagementDetails />
            </UnifiedShell>
          }
        />
        <Route
          path="/manager/project-management"
          element={
            <UnifiedShell role="MANAGER">
              <ProjectManagement />
            </UnifiedShell>
          }
        />
        <Route
          path="/manager/project-management/:projectId"
          element={
            <UnifiedShell role="MANAGER">
              <ProjectManagementDetails />
            </UnifiedShell>
          }
        />
        <Route
          path="/manager/add-project"
          element={
            <UnifiedShell role="MANAGER">
              <AddProject />
            </UnifiedShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} />}>
        <Route
          path="/manager/timesheets"
          element={
            <UnifiedShell role="MANAGER">
              <ManagerTimesheets />
            </UnifiedShell>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["MANAGER"]} requiredModule="TASKS" />}>
        <Route
          path="/manager/ai-assignment"
          element={
            <UnifiedShell role="MANAGER">
              <AIAssignment />
            </UnifiedShell>
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
        <Route path="/dev" element={<UnifiedShell role="DEVELOPER"><DevDashboardHome /></UnifiedShell>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="FILES" />}>
        <Route path="/dev/project/:id" element={<UnifiedShell role="DEVELOPER"><DevWorkspace /></UnifiedShell>} />

        <Route path="/dev/projects" element={<UnifiedShell role="DEVELOPER"><DevProjectList /></UnifiedShell>} />
        <Route path="/dev/projects/:id" element={<UnifiedShell role="DEVELOPER"><DevProjectView /></UnifiedShell>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="TASKS" />}>
        <Route path="/dev/tasks" element={<UnifiedShell role="DEVELOPER"><DevTaskList /></UnifiedShell>} />
        <Route path="/dev/tasks/:id" element={<UnifiedShell role="DEVELOPER"><DevTaskView /></UnifiedShell>} />

        <Route path="/dev/tickets/new" element={<UnifiedShell role="DEVELOPER"><DevTicketCreate /></UnifiedShell>} />
        <Route path="/dev/tickets/:id" element={<UnifiedShell role="DEVELOPER"><DevTicketView /></UnifiedShell>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} />}>

        <Route path="/dev/profile" element={<UnifiedShell role="DEVELOPER"><DevProfile /></UnifiedShell>} />

        <Route path="/dev/settings" element={<UnifiedShell role="DEVELOPER"><DevSettings /></UnifiedShell>} />

        <Route path="/dev/timesheets" element={<UnifiedShell role="DEVELOPER"><DevTimesheets /></UnifiedShell>} />

      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DEVELOPER"]} requiredModule="CHAT" />}>

        <Route path="/dev/chat" element={<UnifiedShell role="DEVELOPER"><DevChat /></UnifiedShell>} />
        <Route path="/dev/chat/:projectId" element={<UnifiedShell role="DEVELOPER"><DevChat /></UnifiedShell>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["CLIENT"]} />}>
        <Route path="/client" element={<UnifiedShell role="CLIENT"><ClientDashboardHome /></UnifiedShell>} />
        <Route path="/client/projects" element={<UnifiedShell role="CLIENT"><ClientProjectList /></UnifiedShell>} />
        <Route path="/client/tickets" element={<UnifiedShell role="CLIENT"><ClientTicketList /></UnifiedShell>} />
        <Route path="/client/history" element={<UnifiedShell role="CLIENT"><ClientHistory /></UnifiedShell>} />
        <Route path="/client/profile" element={<UnifiedShell role="CLIENT"><ClientProfile /></UnifiedShell>} />
        <Route path="/client/settings" element={<UnifiedShell role="CLIENT"><ClientSettings /></UnifiedShell>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}



