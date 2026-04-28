import React from "react";
import {
  DashboardRounded,
  FolderRounded,
  TaskAltRounded,
  BadgeRounded,
  ScheduleRounded,
} from "@mui/icons-material";
import UnifiedSidebar from "../../../components/layout/UnifiedSidebar.jsx";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dev",
    icon: <DashboardRounded />,
  },
  {
    label: "Projects",
    path: "/dev/projects",
    icon: <FolderRounded />,
  },
  {
    label: "Tasks",
    path: "/dev/tasks",
    icon: <TaskAltRounded />,
  },
  {
    label: "Timesheets",
    path: "/dev/timesheets",
    icon: <ScheduleRounded />,
  },
  {
    label: "My Profile",
    path: "/dev/profile",
    icon: <BadgeRounded />,
  },
];

export default function DevSidebar({ open, onClose }) {
  return (
    <UnifiedSidebar
      open={open}
      onClose={onClose}
      title="Developer Menu"
      sections={[
        {
          label: "Navigation",
          items: menuItems.map((item) => ({
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
