import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { loadProfile } from "../../data/profileStore";
import {
  loadNotifications,
  markAllRead,
  markRead
} from "../../data/notificationStore";
import { useAuth } from "../../../context/AuthContext.jsx";
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

export default function DevTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(() => loadProfile());
  const initials = (profile.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const [notifs, setNotifs] = useState(() => loadNotifications());
  const unread = notifs.filter((n) => !n.read).length;

  const [openNotifs, setOpenNotifs] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openProfile = Boolean(anchorEl);

  // keep notifications/profile fresh
  useEffect(() => {
    const id = setInterval(() => {
      setNotifs(loadNotifications());
      setProfile(loadProfile());
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const onMarkAll = () => setNotifs(markAllRead());
  const onOpenNotif = (id) => setNotifs(markRead(id));

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backdropFilter: "blur(14px)",
        background:
          "linear-gradient(180deg, rgba(15,18,35,0.92), rgba(15,18,35,0.55))",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 3,
        zIndex: (theme) => theme.zIndex.drawer + 1
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

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
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
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950, letterSpacing: -0.4 }} noWrap>
              Nexora
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
              Developer Workspace
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            size="small"
            label="DEVELOPER"
            sx={{
              height: 22,
              fontWeight: 900,
              letterSpacing: 0.3,
              background: "rgba(124,92,255,0.16)",
              border: "1px solid rgba(124,92,255,0.25)"
            }}
          />

          <Box sx={{ position: "relative" }}>
            <IconButton
              type="button"
              onClick={() => {
                setOpenNotifs((v) => !v);
                setOpenProfile(false);
              }}
              aria-label="Notifications"
              sx={{
                borderRadius: 2.5,
                border: "1px solid rgba(255,255,255,0.16)",
                bgcolor: "rgba(255,255,255,0.04)"
              }}
            >
              <FiBell className="text-lg" />
              {unread > 0 ? (
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    px: 0.8,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: "#8b5cf6",
                    color: "white",
                    fontSize: 10,
                    lineHeight: 1.2,
                    border: "1px solid rgba(255,255,255,0.10)"
                  }}
                >
                  {unread}
                </Box>
              ) : null}
            </IconButton>

            {openNotifs ? (
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  mt: 1,
                  width: { xs: 320, sm: 384 },
                  maxHeight: 360,
                  overflow: "hidden",
                  borderRadius: 3,
                  background: "rgba(15,18,35,0.96)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
                  zIndex: 50
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <Typography fontWeight={900}>Notifications</Typography>
                  <Chip
                    size="small"
                    label="Mark all read"
                    onClick={onMarkAll}
                    sx={{
                      height: 22,
                      fontWeight: 900,
                      bgcolor: "rgba(124,92,255,0.16)",
                      border: "1px solid rgba(124,92,255,0.25)"
                    }}
                  />
                </Box>

                <Box sx={{ maxHeight: 280, overflow: "auto" }}>
                  {notifs.slice(0, 10).map((n) => (
                    <Box
                      key={n.id}
                      component="button"
                      type="button"
                      onClick={() => onOpenNotif(n.id)}
                      sx={{
                        width: "100%",
                        textAlign: "left",
                        px: 2,
                        py: 1.5,
                        border: 0,
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        background: n.read ? "transparent" : "rgba(255,255,255,0.04)",
                        color: "inherit",
                        cursor: "pointer",
                        "&:hover": { background: "rgba(255,255,255,0.06)" }
                      }}
                    >
                      <Typography variant="body2" fontWeight={800}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "rgba(231,233,238,0.7)" }}>
                        {n.body}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 1, color: "rgba(231,233,238,0.55)" }}>
                        {n.createdAt}
                      </Typography>
                    </Box>
                  ))}
                  {notifs.length === 0 ? (
                    <Typography variant="body2" sx={{ px: 2, py: 3, color: "rgba(231,233,238,0.7)" }}>
                      No notifications.
                    </Typography>
                  ) : null}
                </Box>
              </Box>
            ) : null}
          </Box>

          <Box>
            <IconButton
              type="button"
              onClick={(event) => {
                setOpenNotifs(false);
                setAnchorEl(event.currentTarget);
              }}
              aria-label="Profile menu"
              sx={{
                borderRadius: 2.5,
                border: "1px solid rgba(255,255,255,0.16)",
                bgcolor: "rgba(255,255,255,0.04)",
                px: 0.8
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 13, fontWeight: 900 }}>
                {initials || "U"}
              </Avatar>
              <Box sx={{ display: { xs: "none", md: "block" }, textAlign: "left", ml: 1 }}>
                <Typography variant="body2" fontWeight={800} noWrap sx={{ maxWidth: 160 }}>
                  {profile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.65)" }} noWrap>
                  {profile.email}
                </Typography>
              </Box>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={openProfile}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 240,
                  borderRadius: 3,
                  background: "rgba(15,18,35,0.96)",
                  backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
                  zIndex: (theme) => theme.zIndex.modal + 1
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <Typography variant="body2" fontWeight={900} noWrap>
                  {profile.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.65)" }} noWrap>
                  {profile.email}
                </Typography>
              </Box>

              <Box sx={{ py: 1 }}>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/dev/profile");
                  }}
                >
                  <PersonIcon fontSize="small" style={{ marginRight: 10 }} />
                  Profile
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/dev");
                  }}
                >
                  <PersonIcon fontSize="small" style={{ marginRight: 10 }} />
                  Dashboard
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

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
              </Box>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
