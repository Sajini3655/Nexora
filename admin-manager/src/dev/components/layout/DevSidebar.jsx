import React from "react";
import {
  DashboardRounded,
  FolderRounded,
  TaskAltRounded,
  BadgeRounded,
  AccessTimeRounded,
} from "@mui/icons-material";
import UnifiedSidebar from "../../../components/layout/UnifiedSidebar.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function DevSidebar({ open, onClose }) {
  const { moduleAccess, accessLoading } = useAuth();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dev",
      icon: <DashboardRounded />,
      module: "DASHBOARD",
    },
    {
      label: "Projects",
      path: "/dev/projects",
      icon: <FolderRounded />,
      module: "FILES",
    },
    {
      label: "Tasks",
      path: "/dev/tasks",
      icon: <TaskAltRounded />,
      module: "TASKS",
    },
    {
      label: "Timesheets",
      path: "/dev/timesheets",
      icon: <AccessTimeRounded />,
    },
    {
      label: "My Profile",
      path: "/dev/profile",
      icon: <BadgeRounded />,
    },
  ];

  const visibleItems = menuItems.filter((item) => {
    if (!item.module) return true;
    if (accessLoading || !moduleAccess) return false;
    return Boolean(moduleAccess[item.module]);
  });

  return (
    <UnifiedSidebar
      open={open}
      onClose={onClose}
      title="Developer Menu"
      sections={[
        {
          label: "Navigation",
          items: visibleItems.map((item) => ({
            to: item.path,
            label: item.label,
            icon: item.icon,
            end: item.path === "/dev",
          })),
        },
      ]}
      footer="Developer Role • Build Workspace"
    />
  );
}
