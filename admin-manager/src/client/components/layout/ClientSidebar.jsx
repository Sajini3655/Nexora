import React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import UnifiedSidebar from "../../../components/layout/UnifiedSidebar.jsx";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { useAuth } from "../../../context/AuthContext.jsx";

const links = [
  { to: "/client", label: "Dashboard", icon: <DashboardRoundedIcon />, end: true },
  { to: "/client/tickets", label: "Tickets", icon: <ConfirmationNumberRoundedIcon />, module: "TICKETS", alwaysVisible: true },
  { to: "/client/history", label: "History", icon: <HistoryRoundedIcon /> },
  { to: "/client/projects", label: "Workstreams", icon: <FolderOpenRoundedIcon /> },
];

export default function ClientSidebar({ open, onClose }) {
  const { moduleAccess, accessLoading } = useAuth();

  const visibleLinks = links.filter((item) => {
    if (item.alwaysVisible) return true;
    if (!item.module) return true;
    if (accessLoading || !moduleAccess) return false;
    return Boolean(moduleAccess[item.module]);
  });

  return (
    <UnifiedSidebar
      open={open}
      onClose={onClose}
      title="Client Menu"
      sections={[{ label: "Navigation", items: visibleLinks }]}
      footer="Client Role • Stakeholder Workspace"
      width={292}
    />
  );
}
