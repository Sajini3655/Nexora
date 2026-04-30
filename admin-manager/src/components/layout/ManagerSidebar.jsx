import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FolderIcon from "@mui/icons-material/Folder";
// AutoAwesomeIcon removed — menu entry eliminated
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import UnifiedSidebar from "./UnifiedSidebar.jsx";

const navItems = [
  { label: "Dashboard", to: "/manager", icon: <DashboardIcon /> },
  { label: "Tickets", to: "/manager/tickets", icon: <ConfirmationNumberRoundedIcon /> },
  { label: "Add Project", to: "/manager/add-project", icon: <AddCircleIcon /> },
  { label: "Project Management", to: "/manager/project-management", icon: <FolderIcon /> },
  { label: "Timesheets", to: "/manager/timesheets", icon: <AccessTimeRoundedIcon /> },
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
          items: navItems.map((item) => ({
            ...item,
            end: item.to === "/manager",
          })),
        },
      ]}
      footer="Manager Role • Delivery Workspace"
    />
  );
}
