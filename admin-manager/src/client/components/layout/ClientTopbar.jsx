import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export default function ClientTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  let displayName = "Client";
  let email = "client@nexora.local";

  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.name) displayName = parsed.name;
    if (parsed?.email) email = parsed.email;
  } catch {
    displayName = "Client";
  }

  const initials = (displayName?.[0] || email?.[0] || "C").toUpperCase();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: 20,
        bgcolor: "#07111f",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 3 } }}>
        <IconButton
          color="inherit"
          onClick={onToggleSidebar}
          sx={{
            mr: 1.5,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 2,
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box>
          <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>
            Client Workspace
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Tickets and workstream updates
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Chip
          size="small"
          label="CLIENT"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            mr: 1.5,
            bgcolor: "rgba(124,92,255,0.16)",
            color: "#ddd6fe",
            border: "1px solid rgba(124,92,255,0.28)",
            fontWeight: 800,
          }}
        />

        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            p: 0.4,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#6d5dfc",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {initials}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 230,
              borderRadius: 2,
              bgcolor: "#0f172a",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.10)",
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={900}>{displayName}</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              {email}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              navigate("/client/profile");
            }}
          >
            <PersonIcon fontSize="small" style={{ marginRight: 10 }} />
            My Profile
          </MenuItem>

          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            <LogoutIcon fontSize="small" style={{ marginRight: 10 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
