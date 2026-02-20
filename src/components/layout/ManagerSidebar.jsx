import React from "react";
import { Box, List, ListItemButton, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ManagerSidebar({ open, onClose }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: "#1f2937",
        color: "white",
        position: "fixed",
        top: "72px",
        height: "calc(100% - 72px)",
        display: open ? "block" : "none",
        zIndex: 1200,
      }}
    >
      <List>
        <ListItemButton onClick={() => handleNavigate("/manager")}>
          <ListItemText primary="Main Dashboard" />
        </ListItemButton>

        <ListItemButton onClick={() => handleNavigate("/manager/add-project")}>
          <ListItemText primary="Add Project" />
        </ListItemButton>

        <ListItemButton onClick={() => handleNavigate("/manager/project-management")}>
          <ListItemText primary="Project Management" />
        </ListItemButton>

        <ListItemButton onClick={() => handleNavigate("/manager/settings")}>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
    </Box>
  );
}
