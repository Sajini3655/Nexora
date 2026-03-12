import React from "react";
import { Box, List, ListItemButton, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";

const drawerWidth = 260;

export default function DeveloperSidebar({ open, onClose }) {
  const navigate = useNavigate();

  const go = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box
      sx={{
        width: drawerWidth,
        bgcolor: "rgba(15,18,35,0.92)",
        color: "white",
        position: "fixed",
        top: "72px",
        height: "calc(100% - 72px)",
        display: open ? "block" : "none",
        zIndex: 1200,
        borderRight: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(14px)",
      }}
    >
      <List>
        <ListItemButton onClick={() => go("/developer")}>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton onClick={() => go("/developer/project/P-001")}>
          <ListItemText primary="Workspace" />
        </ListItemButton>
        <ListItemButton onClick={() => go("/developer/tasks")}>
          <ListItemText primary="Tasks" />
        </ListItemButton>
        <ListItemButton onClick={() => go("/developer/profile")}>
          <ListItemText primary="Profile" />
        </ListItemButton>
        <ListItemButton onClick={() => go("/developer/settings")}>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
    </Box>
  );
}
