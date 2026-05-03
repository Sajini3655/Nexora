import React, { useState } from "react";
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
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { layoutGaps } from "../../theme/layoutGaps.js";

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const initials = (user?.name?.[0] || user?.email?.[0] || "N").toUpperCase();
  const roleLabel = String(user?.role || "USER").toUpperCase();

  const profilePath =
    roleLabel === "DEVELOPER"
      ? "/dev/profile"
      : roleLabel === "CLIENT"
        ? "/client/profile"
        : "/profile";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: layoutGaps.topbar.topInset,
        left: layoutGaps.topbar.sideInset,
        right: layoutGaps.topbar.sideInset,
        width: `calc(100% - ${layoutGaps.topbar.sideInset * 2}px)`,
        height: layoutGaps.topbar.height,
        justifyContent: "center",
        borderRadius: "0 0 20px 20px",
        background: "rgba(11,17,32,0.94)",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
        backdropFilter: "blur(14px)",
        zIndex: 1400,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${layoutGaps.topbar.toolbarMinHeight}px !important`,
          px: { xs: 2, md: 4 },
          display: "flex",
          alignItems: "center",
          gap: 1.4,
        }}
      >
        <IconButton
          onClick={onMenuClick}
          sx={{
            width: 42,
            height: 42,
            color: "#e5e7eb",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            boxShadow: "none",
            "&:hover": {
              background: "rgba(255,255,255,0.06)",
              borderColor: "rgba(148,163,184,0.18)",
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5b6cff, #60a5fa)",
            boxShadow: "0 10px 24px rgba(91,108,255,0.16)",
            border: "1px solid rgba(255,255,255,0.10)",
            flexShrink: 0,
          }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 900,
              color: "#f8fafc",
              letterSpacing: -0.2,
              lineHeight: 1.05,
              fontSize: 17,
            }}
          >
            Nexora
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1,
                px: 1.25,
                py: 0.7,
                borderRadius: 999,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(148,163,184,0.10)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 900,
                  color: "#e5e7eb",
                  maxWidth: 190,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name || user.email}
              </Typography>

              <Chip
                size="small"
                label={roleLabel}
                sx={{
                  height: 23,
                    color: "#e2e8f0",
                    fontWeight: 850,
                    fontSize: 10.5,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(148,163,184,0.16)",
                }}
              />
            </Box>

            <IconButton
              sx={{
                width: 42,
                height: 42,
                color: "#e5e7eb",
                border: "1px solid rgba(148,163,184,0.12)",
                background: "rgba(255,255,255,0.03)",
                "&:hover": {
                  background: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <NotificationsNoneIcon />
            </IconButton>

            <IconButton
              onClick={(event) => setAnchorEl(event.currentTarget)}
              sx={{
                p: 0.55,
                borderRadius: "50%",
                border: "1px solid rgba(148,163,184,0.16)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Avatar
                sx={{
                  width: 37,
                  height: 37,
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#fff",
                  background: "linear-gradient(135deg, #5b6cff, #4857d8)",
                  boxShadow: "0 10px 22px rgba(91,108,255,0.16)",
                }}
              >
                {initials}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  mt: 1.2,
                  minWidth: 240,
                  borderRadius: 3,
                  background: "rgba(15,23,42,0.98)",
                  color: "#e5e7eb",
                  border: "1px solid rgba(148,163,184,0.18)",
                  boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
                  backdropFilter: "blur(18px)",
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 950 }}>
                  {user.name || roleLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  {user.email}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate(profilePath);
                }}
              >
                <PersonIcon fontSize="small" sx={{ mr: 1.2 }} />
                My Profile
              </MenuItem>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                  navigate("/login");
                }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1.2 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : null}
      </Toolbar>
    </AppBar>
  );
}
