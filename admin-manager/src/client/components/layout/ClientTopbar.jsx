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
  Typography
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
      position="static"
      elevation={0}
      sx={{
        backdropFilter: "blur(14px)",
        background:
          "linear-gradient(180deg, rgba(15,18,35,0.92), rgba(15,18,35,0.55))",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 3
      }}
    >
      <Toolbar sx={{ minHeight: 72, gap: 1.5 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onToggleSidebar}
          sx={{
            mr: 1,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.10)"
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(124,92,255,0.95), rgba(124,92,255,0.35))",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 12px 34px rgba(124,92,255,0.18)"
            }}
          />
          <Box>
            <Typography sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
              Nexora
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Client Workspace
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1.2 }}>
          <Chip
            size="small"
            label="CLIENT"
            sx={{
              height: 22,
              fontWeight: 900,
              letterSpacing: 0.3,
              background: "rgba(124,92,255,0.16)",
              border: "1px solid rgba(124,92,255,0.25)"
            }}
          />
          <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 800 }}>
            {displayName}
          </Typography>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              p: 0.6,
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.16)",
              backgroundColor: "rgba(255,255,255,0.04)"
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: 13,
                fontWeight: 900
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 3,
              background: "rgba(15,18,35,0.92)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)"
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.6 }}>
            <Typography fontWeight={950} sx={{ lineHeight: 1.1 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {email}
            </Typography>

            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                label="CLIENT"
                sx={{
                  height: 22,
                  fontWeight: 900,
                  background: "rgba(124,92,255,0.16)",
                  border: "1px solid rgba(124,92,255,0.25)"
                }}
              />
            </Box>
          </Box>

          <Divider />

          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              navigate("/client/profile");
            }}
          >
            <PersonIcon fontSize="small" style={{ marginRight: 10 }} />
            My Profile
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              localStorage.removeItem("user");
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
