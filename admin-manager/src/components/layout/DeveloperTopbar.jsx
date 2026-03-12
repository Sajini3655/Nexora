import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Badge,
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
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { loadNotifications, markAllRead, markRead } from "../../dev/data/notificationStore";

export default function DeveloperTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const base = user?.name || user?.email || "D";
    return base
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "D";
  }, [user?.name, user?.email]);

  const [notifs, setNotifs] = useState(() => loadNotifications());
  const unread = notifs.filter((n) => !n.read).length;

  const [notifAnchor, setNotifAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNotifs(loadNotifications()), 1200);
    return () => clearInterval(id);
  }, []);

  const openNotifs = Boolean(notifAnchor);
  const openUser = Boolean(userAnchor);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: 72 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{
              mr: 0.5,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            role="button"
            tabIndex={0}
            onClick={() => navigate("/developer")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/developer");
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              cursor: "pointer",
              userSelect: "none",
              borderRadius: 2,
              px: 0.5,
              py: 0.25,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(124,92,255,0.95), rgba(124,92,255,0.35))",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 12px 34px rgba(124,92,255,0.18)",
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, letterSpacing: -0.4, lineHeight: 1.1 }}>
                Nexora
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.1 }}>
                Developer
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Chip
          size="small"
          label="DEVELOPER"
          sx={{
            height: 22,
            fontWeight: 900,
            letterSpacing: 0.3,
            background: "rgba(124,92,255,0.16)",
            border: "1px solid rgba(124,92,255,0.25)",
            display: { xs: "none", sm: "inline-flex" },
          }}
        />

        {/* Notifications */}
        <IconButton
          sx={{
            ml: 1,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.16)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
          onClick={(e) => setNotifAnchor(e.currentTarget)}
          aria-label="Notifications"
        >
          <Badge color="secondary" badgeContent={unread} invisible={unread === 0}>
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={notifAnchor}
          open={openNotifs}
          onClose={() => setNotifAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 360,
              maxWidth: 420,
              borderRadius: 3,
              background: "rgba(15,18,35,0.92)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography fontWeight={950}>Notifications</Typography>
            <Chip
              size="small"
              label="Mark all read"
              onClick={() => setNotifs(markAllRead())}
              sx={{
                cursor: "pointer",
                height: 24,
                fontWeight: 900,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          </Box>

          <Divider />

          {notifs.slice(0, 10).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => setNotifs(markRead(n.id))}
              sx={{
                alignItems: "flex-start",
                whiteSpace: "normal",
                gap: 1,
                opacity: n.read ? 0.78 : 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
                  {n.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>
                  {n.body}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, mt: 0.4, display: "block" }}>
                  {n.createdAt}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          {notifs.length === 0 ? (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                No notifications.
              </Typography>
            </Box>
          ) : null}
        </Menu>

        {/* User menu */}
        <IconButton
          onClick={(e) => setUserAnchor(e.currentTarget)}
          sx={{
            ml: 1,
            p: 0.6,
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.16)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {initials}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={userAnchor}
          open={openUser}
          onClose={() => setUserAnchor(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 3,
              background: "rgba(15,18,35,0.92)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)",
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.6 }}>
            <Typography fontWeight={950} sx={{ lineHeight: 1.1 }}>
              {user?.name || user?.email || "Developer"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setUserAnchor(null);
              navigate("/developer/profile");
            }}
          >
            <PersonIcon fontSize="small" style={{ marginRight: 10 }} />
            My Profile
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setUserAnchor(null);
              logout();
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
