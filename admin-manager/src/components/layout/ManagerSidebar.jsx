import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import FolderIcon from "@mui/icons-material/Folder";
// AutoAwesomeIcon removed — menu entry eliminated
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import UnifiedSidebar from "./UnifiedSidebar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard", to: "/manager", icon: <DashboardIcon />, module: "DASHBOARD" },
  { label: "Tickets", to: "/manager/tickets", icon: <ConfirmationNumberRoundedIcon />, module: "TICKETS", alwaysVisible: true },
  { label: "Add Project", to: "/manager/add-project", icon: <AddCircleIcon />, module: "FILES" },
  { label: "Project Management", to: "/manager/project-management", icon: <FolderIcon />, module: "FILES" },
  { label: "Timesheets", to: "/manager/timesheets", icon: <AccessTimeRoundedIcon /> },
];

export default function ManagerSidebar({ open, onClose }) {
  const { moduleAccess, accessLoading } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (item.alwaysVisible) return true;
    if (!item.module) return true;
    if (accessLoading || !moduleAccess) return false;
    return Boolean(moduleAccess[item.module]);
  });

  return (
    <UnifiedSidebar
      open={open}
      onClose={onClose}
      title="Manager Menu"
      sections={[
        {
          label: "Navigation",
          items: visibleItems.map((item) => ({
            ...item,
            end: item.to === "/manager",
          })),
        },
      ]}
      footer="Manager Role • Delivery Workspace"
    />
  );
}
