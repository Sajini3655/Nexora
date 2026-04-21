import React, { useState } from "react";
import ManagerSidebar from "./ManagerSidebar";
import { Box, AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export default function ManagerShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#050b18",
        color: "white",
      }}
    >
      <ManagerSidebar open={open} onClose={() => setOpen(false)} />

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: "rgba(10,16,35,0.82)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Manager Panel
            </Typography>
          </Toolbar>
        </AppBar>

        <Toolbar />

        <Box sx={{ flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}