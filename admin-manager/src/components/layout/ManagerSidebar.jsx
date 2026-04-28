import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FolderIcon from "@mui/icons-material/Folder";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScheduleIcon from "@mui/icons-material/Schedule";
import UnifiedSidebar from "./UnifiedSidebar.jsx";

const navItems = [
  { label: "Dashboard", to: "/manager", icon: <DashboardIcon /> },
  { label: "Add Project", to: "/manager/add-project", icon: <AddCircleIcon /> },
  { label: "Project Management", to: "/manager/project-management", icon: <FolderIcon /> },
  { label: "AI Task Assignment", to: "/manager/ai-assignment", icon: <AutoAwesomeIcon /> },
  { label: "Timesheets", to: "/manager/timesheets", icon: <ScheduleIcon /> },
];

export default function ManagerSidebar({ open, onClose }) {
  return (
    <UnifiedSidebar
      open={open}
      onClose={onClose}
      title="Manager Menu"
      sections={[
        {
          label: "Navigation",
          items: navItems.map((item) => ({ ...item, end: item.to === "/manager" })),
        },
      ]}
      footer="Manager Role • Delivery Workspace"
    />
  );
}
