import React, { useState } from "react";
import ManagerSidebar from "./ManagerSidebar";
import { Box, AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export default function ManagerShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#111827", color: "white" }}>
      
      {/* Sidebar */}
      <ManagerSidebar open={open} onClose={() => setOpen(false)} />

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Topbar */}
        <AppBar position="fixed" sx={{ bgcolor: "#1f2937" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">Manager Panel</Typography>
          </Toolbar>
        </AppBar>

        {/* Spacer for fixed AppBar */}
        <Toolbar />

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>

      </Box>
    </Box>
  );
}
