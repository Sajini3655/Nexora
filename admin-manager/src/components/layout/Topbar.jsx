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
        borderRadius: "0 0 24px 24px",
        background:
          "linear-gradient(135deg, rgba(51,45,88,0.96) 0%, rgba(15,23,42,0.97) 52%, rgba(7,34,44,0.96) 100%)",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
        backdropFilter: "blur(20px)",
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
            border: "1px solid rgba(255,255,255,0.13)",
            background: "rgba(255,255,255,0.055)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            "&:hover": {
              background: "rgba(124,92,255,0.18)",
              borderColor: "rgba(167,139,250,0.34)",
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
            background: "linear-gradient(135deg, #7c5cff, #38bdf8)",
            boxShadow: "0 12px 35px rgba(124,92,255,0.35)",
            border: "1px solid rgba(255,255,255,0.18)",
            flexShrink: 0,
          }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 950,
              color: "#f8fafc",
              letterSpacing: -0.35,
              lineHeight: 1.05,
              fontSize: 18,
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
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(148,163,184,0.14)",
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
                  color: "#ddd6fe",
                  fontWeight: 950,
                  fontSize: 11,
                  background: "rgba(124,92,255,0.18)",
                  border: "1px solid rgba(167,139,250,0.30)",
                }}
              />
            </Box>

            <IconButton
              sx={{
                width: 42,
                height: 42,
                color: "#e5e7eb",
                border: "1px solid rgba(148,163,184,0.16)",
                background: "rgba(255,255,255,0.04)",
                "&:hover": {
                  background: "rgba(255,255,255,0.08)",
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
                border: "1px solid rgba(167,139,250,0.28)",
                background: "rgba(124,92,255,0.10)",
              }}
            >
              <Avatar
                sx={{
                  width: 37,
                  height: 37,
                  fontSize: 15,
                  fontWeight: 950,
                  color: "#fff",
                  background: "linear-gradient(135deg, #7c5cff, #6d5dfc)",
                  boxShadow: "0 12px 28px rgba(124,92,255,0.28)",
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
