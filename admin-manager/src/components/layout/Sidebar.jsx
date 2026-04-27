import React from "react";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import SecurityIcon from "@mui/icons-material/Security";
import SettingsIcon from "@mui/icons-material/Settings";

import { useLayout } from "../../context/LayoutContext";
import UnifiedSidebar from "./UnifiedSidebar.jsx";

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useLayout();

  const itemsCore = [
    { to: "/admin", label: "Dashboard", icon: <AdminPanelSettingsIcon /> },
    { to: "/users", label: "Users", icon: <PeopleIcon /> },
  ];

  const itemsSecurity = [
    { to: "/access", label: "Access Control", icon: <SecurityIcon /> },
    { to: "/settings", label: "System Settings", icon: <SettingsIcon /> },
  ];

  return (
    <UnifiedSidebar
      open={sidebarOpen}
      onClose={closeSidebar}
      title="Nexora Admin"
      subtitle="Identity & Control"
      sections={[
        { label: "Core", items: itemsCore },
        { label: "Security", items: itemsSecurity },
      ]}
      footer="Admin Role • Secure Mode"
      width={292}
    />
  );
}

