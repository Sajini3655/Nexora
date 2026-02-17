import React from "react";
import { Drawer, Box, List, ListItemButton, ListItemText, Toolbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ManagerSidebar({ open, onClose }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    onClose(); // close drawer after click
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": { width: 240, bgcolor: "#1f2937", color: "white" },
      }}
    >
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <List>
          <ListItemButton onClick={() => handleNavigate("/manager")}>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate("/manager/projects")}>
            <ListItemText primary="Projects" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate("/manager/add-project")}>
            <ListItemText primary="Add Project" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate("/manager/tickets")}>
            <ListItemText primary="Tickets" />
          </ListItemButton>
          <ListItemButton onClick={() => handleNavigate("/manager/ai-summaries")}>
            <ListItemText primary="AI Summaries" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
}
