import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useLayout } from "../../context/LayoutContext";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar } = useLayout();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const initials =
    (user?.name?.[0] || user?.email?.[0] || "A").toUpperCase();

  const roleLabel = user?.role || "ADMIN";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backdropFilter: "blur(14px)",
        background:
          "linear-gradient(180deg, rgba(15,18,35,0.92), rgba(15,18,35,0.55))",
        borderBottom: "1px solid rgba(255,255,255,0.10)"
      }}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        {/* Hamburger */}
        <IconButton
          edge="start"
          color="inherit"
          onClick={toggleSidebar}
          sx={{
            mr: 1,
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.10)"
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Brand */}
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
          <Typography sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
            Nexora
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* User block */}
        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Name + role (hide name on xs) */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 800 }}>
                {user.name || user.email}
              </Typography>
              <Chip
                size="small"
                label={roleLabel}
                sx={{
                  height: 22,
                  fontWeight: 900,
                  letterSpacing: 0.3,
                  background: "rgba(124,92,255,0.16)",
                  border: "1px solid rgba(124,92,255,0.25)"
                }}
              />
            </Box>

            {/* Avatar */}
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

            {/* Menu */}
            <Menu
              anchorEl={anchorEl}
              open={open}
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
                  {user.name || "Admin"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {user.email}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={roleLabel}
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
                  navigate("/profile");
                }}
              >
                <PersonIcon fontSize="small" style={{ marginRight: 10 }} />
                My Profile
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                  navigate("/login");
                }}
              >
                <LogoutIcon fontSize="small" style={{ marginRight: 10 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : null}
      </Toolbar>
    </AppBar>
  );
}
