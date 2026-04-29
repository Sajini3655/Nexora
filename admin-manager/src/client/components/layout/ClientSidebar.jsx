import React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import UnifiedSidebar from "../../../components/layout/UnifiedSidebar.jsx";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";

const links = [
  { to: "/client", label: "Dashboard", icon: <DashboardRoundedIcon />, end: true },
  { to: "/client/tickets", label: "Tickets", icon: <ConfirmationNumberRoundedIcon /> },
  { to: "/client/history", label: "History", icon: <HistoryRoundedIcon />, },
  { to: "/client/projects", label: "Workstreams", icon: <FolderOpenRoundedIcon /> },
];

export default function ClientSidebar({ open, onClose }) {
  return (
    <UnifiedSidebar
      open={open}
      onClose={onClose}
      title="Client Menu"
      sections={[{ label: "Navigation", items: links }]}
      footer="Client Role • Stakeholder Workspace"
      width={292}
    />
  );
}

