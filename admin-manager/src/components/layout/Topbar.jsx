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
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useThemeMode } from "../../context/ThemeContext.jsx";
import { layoutGaps } from "../../theme/layoutGaps.js";
import { getActiveRole } from "../../utils/roleRouting";
import { getUserRoles } from "../../utils/roleRouting";
import NLQNav from "./NLQNav.jsx";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

function roleFromPathname(pathname) {
  const path = String(pathname || "");
  if (path.startsWith("/dev")) return "DEVELOPER";
  if (path.startsWith("/client")) return "CLIENT";
  if (path.startsWith("/manager")) return "MANAGER";
  if (path.startsWith("/admin") || path === "/access" || path === "/settings") return "ADMIN";
  if (path.startsWith("/admin/")) return "ADMIN";
  return "";
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { mode, toggleColorScheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const initials = (user?.name?.[0] || user?.email?.[0] || "N").toUpperCase();
  const effectiveRole = roleFromPathname(location.pathname) || getActiveRole(user) || user?.role || "USER";
  const roleLabel = String(effectiveRole).toUpperCase();
  const roles = getUserRoles(user);
  const showRoleSwitch = roles.length > 1;

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
        borderRadius: 'var(--nx-radius-section, 22px)',
        background: "var(--nx-panel)",
        border: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
        color: "var(--nx-text)",
        zIndex: 1600,
      }}
    >
      <Toolbar
        sx={{
          minHeight: `${layoutGaps.topbar.toolbarMinHeight}px !important`,
          px: { xs: 2, md: 3 },
          display: "flex",
          alignItems: "center",
          gap: 1.4,
        }}
      >
        <IconButton
          onClick={(event) => {
            event.currentTarget.blur();
            onMenuClick?.();
          }}
          sx={{
            width: 42,
            height: 42,
            color: "var(--nx-text)",
            border: "1px solid var(--nx-border)",
            background: "var(--nx-panel-2)",
            boxShadow: "none",
            "&:hover": {
              background: "var(--nx-card)",
              borderColor: "var(--nx-border-strong)",
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box
          onClick={() => {
            const base = roleLabel === "DEVELOPER" ? "/dev" : roleLabel === "CLIENT" ? "/client" : roleLabel === "MANAGER" ? "/manager" : roleLabel === "ADMIN" ? "/admin" : "/";
            navigate(base);
          }}
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--nx-purple)",
            border: "1px solid var(--nx-border)",
            flexShrink: 0,
            cursor: "pointer",
          }}
        />

        <Box sx={{ minWidth: 0, cursor: "pointer" }} onClick={() => {
            const base = roleLabel === "DEVELOPER" ? "/dev" : roleLabel === "CLIENT" ? "/client" : roleLabel === "MANAGER" ? "/manager" : roleLabel === "ADMIN" ? "/admin" : "/";
            navigate(base);
        }}>
          <Typography
            sx={{
              fontWeight: 900,
              color: "var(--nx-text)",
              letterSpacing: -0.2,
              lineHeight: 1.05,
              fontSize: 17,
            }}
          >
            Nexora
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
          <NLQNav />
        </Box>

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
                  background: "var(--nx-panel-2)",
                  border: "1px solid var(--nx-border)",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 900,
                    color: "var(--nx-text)",
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
                    color: "var(--nx-text)",
                    fontWeight: 850,
                    fontSize: 10.5,
                    background: "var(--nx-card)",
                    border: "1px solid var(--nx-border)",
                }}
              />
            </Box>

            <IconButton
              onClick={() => toggleColorScheme(mode === "dark" ? "light" : "dark")}
              aria-label="Toggle color scheme"
              title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              sx={{
                width: 42,
                height: 42,
                color: "var(--nx-text)",
                border: "1px solid var(--nx-border)",
                background: "var(--nx-panel-2)",
                "&:hover": {
                  background: "var(--nx-card)",
                  borderColor: "var(--nx-border-strong)",
                },
              }}
            >
              {mode === "dark" ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>

            <IconButton
              sx={{
                width: 42,
                height: 42,
                color: "var(--nx-text)",
                border: "1px solid var(--nx-border)",
                background: "var(--nx-panel-2)",
                "&:hover": {
                  background: "var(--nx-card)",
                },
              }}
            >
              <NotificationsNoneIcon />
            </IconButton>

            <IconButton
              onClick={(event) => setAnchorEl((prev) => (prev ? null : event.currentTarget))}
              sx={{
                p: 0.55,
                borderRadius: "50%",
                border: "1px solid var(--nx-border)",
                background: "var(--nx-panel-2)",
              }}
            >
              <Avatar
                sx={{
                  width: 37,
                  height: 37,
                  fontSize: 15,
                  fontWeight: 900,
                      color: "var(--nx-on-accent)",
                  background: "var(--nx-purple)",
                  boxShadow: "var(--nx-shadow)",
                }}
              >
                {initials}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={() => setAnchorEl(null)}
              autoFocus={false}
              MenuListProps={{ autoFocusItem: false }}
              PaperProps={{
                sx: {
                  mt: 1.2,
                  minWidth: 240,
                  borderRadius: 3,
                  background: "var(--nx-card)",
                  color: "var(--nx-text)",
                  border: "1px solid var(--nx-border)",
                  boxShadow: "var(--nx-shadow)",
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 950 }}>
                  {user.name || roleLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
                  {user.email}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: "var(--nx-border)" }} />

              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  navigate(profilePath);
                }}
              >
                <PersonIcon fontSize="small" sx={{ mr: 1.2 }} />
                My Profile
              </MenuItem>

              {showRoleSwitch ? (
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/choose-workspace");
                  }}
                >
                  Switch Role
                </MenuItem>
              ) : null}

              <Divider sx={{ borderColor: "var(--nx-border)" }} />

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


