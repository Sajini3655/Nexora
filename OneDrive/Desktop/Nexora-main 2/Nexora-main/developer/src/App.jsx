import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"; // <-- Add Navigate here

import DevDashboardHome from "./pages/dashboard/DevDashboardHome";
import DevWorkspace from "./pages/workspace/DevWorkspace";
import DevTaskView from "./pages/tasks/DevTaskView";
import DevTicketView from "./pages/tickets/DevTicketView";
import DevTicketCreate from "./pages/tickets/DevTicketCreate";
import DevProfile from "./pages/profile/DevProfile";
import DevChat from "./pages/chat/DevChat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DevDashboardHome />} />
        <Route path="/project/:id" element={<DevWorkspace />} />
        <Route path="/tasks/:id" element={<DevTaskView />} />
        <Route path="/tickets/:id" element={<DevTicketView />} />
        <Route path="/tickets/new" element={<DevTicketCreate />} />
        <Route path="/profile" element={<DevProfile />} />

        {/* Chat routes */}
        <Route path="/chat" element={<Navigate to="/chat/defaultProjectId" replace />} />
        <Route path="/chat/:projectId" element={<DevChat />} />
      </Routes>
    </Router>
  );
}

export default App;