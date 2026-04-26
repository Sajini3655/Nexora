import React from "react";
import { Box, List, ListItemButton, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ManagerSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: "rgba(15,20,40,0.96)",
        backdropFilter: "blur(10px)",
        color: "white",
        position: "fixed",
        top: "64px",
        height: "calc(100% - 64px)",
        display: open ? "block" : "none",
        zIndex: 1200,
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <List>
        {hasPermission("DASHBOARD") && (
          <ListItemButton onClick={() => handleNavigate("/manager")}>
            <ListItemText primary="Main Dashboard" />
          </ListItemButton>
        )}

        {hasPermission("TASKS") && (
          <>
            <ListItemButton onClick={() => handleNavigate("/manager/add-project")}>
              <ListItemText primary="Add Project" />
            </ListItemButton>

            <ListItemButton onClick={() => handleNavigate("/manager/project-management")}>
              <ListItemText primary="Project Management" />
            </ListItemButton>

            <ListItemButton onClick={() => handleNavigate("/manager/ai-assignment")}>
              <ListItemText primary="AI Task Assignment" />
            </ListItemButton>
          </>
        )}

        {hasPermission("CHAT") && (
          <ListItemButton onClick={() => handleNavigate("/manager/chat")}>
            <ListItemText primary="Chat" />
          </ListItemButton>
        )}

        {hasPermission("FILES") && (
          <ListItemButton onClick={() => handleNavigate("/manager/files")}>
            <ListItemText primary="Files" />
          </ListItemButton>
        )}

        {hasPermission("REPORTS") && (
          <ListItemButton onClick={() => handleNavigate("/manager/reports")}>
            <ListItemText primary="Reports" />
          </ListItemButton>
        )}
      </List>
    </Box>
  );
}