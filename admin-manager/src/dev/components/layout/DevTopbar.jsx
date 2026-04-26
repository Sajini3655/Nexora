import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { loadProfile } from "../../data/profileStore";
import {
  loadNotifications,
  markAllRead,
  markRead,
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
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export default function DevTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(() => loadProfile());
  const [notifs, setNotifs] = useState(() => loadNotifications());
  const [openNotifs, setOpenNotifs] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const unread = notifs.filter((n) => !n.read).length;
  const openProfile = Boolean(anchorEl);

  const initials = (profile.name || "D")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

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
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: 20,
        bgcolor: "rgba(7, 17, 31, 0.86)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <Toolbar sx={{ minHeight: 68, px: { xs: 2, md: 3 } }}>
        <IconButton
          color="inherit"
          onClick={onToggleSidebar}
          sx={{
            mr: 1.5,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.03)",
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, lineHeight: 1 }} noWrap>
            Developer Workspace
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }} noWrap>
            Tasks, projects, tickets, and chat
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Chip
          size="small"
          label="DEVELOPER"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            mr: 1.5,
            bgcolor: "rgba(124,92,255,0.16)",
            color: "#ddd6fe",
            border: "1px solid rgba(124,92,255,0.28)",
            fontWeight: 800,
          }}
        />

        <Box sx={{ position: "relative", mr: 1 }}>
          <IconButton
            onClick={() => {
              setOpenNotifs((v) => !v);
              setAnchorEl(null);
            }}
            sx={{
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.12)",
              bgcolor: "rgba(255,255,255,0.03)",
            }}
          >
            <FiBell />
            {unread > 0 ? (
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 18,
                  height: 18,
                  px: 0.5,
                  borderRadius: 999,
                  bgcolor: "#6d5dfc",
                  color: "#fff",
                  fontSize: 10,
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid rgba(255,255,255,0.18)",
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
                width: { xs: 310, sm: 370 },
                maxHeight: 360,
                overflow: "hidden",
                borderRadius: 2,
                bgcolor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                zIndex: 50,
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography sx={{ fontWeight: 900 }}>Notifications</Typography>
                <Chip
                  size="small"
                  label="Mark all read"
                  onClick={onMarkAll}
                  sx={{
                    bgcolor: "rgba(124,92,255,0.16)",
                    color: "#ddd6fe",
                    fontWeight: 800,
                  }}
                />
              </Box>

              <Box sx={{ maxHeight: 290, overflow: "auto" }}>
                {notifs.length === 0 ? (
                  <Typography sx={{ px: 2, py: 3, color: "#94a3b8", fontSize: 14 }}>
                    No notifications.
                  </Typography>
                ) : (
                  notifs.slice(0, 10).map((n) => (
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
                        bgcolor: n.read ? "transparent" : "rgba(255,255,255,0.04)",
                        color: "#e5e7eb",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                        {n.title}
                      </Typography>
                      <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.5 }}>
                        {n.body}
                      </Typography>
                      <Typography sx={{ color: "#64748b", fontSize: 11, mt: 0.8 }}>
                        {n.createdAt}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          ) : null}
        </Box>

        <IconButton
          onClick={(event) => {
            setOpenNotifs(false);
            setAnchorEl(event.currentTarget);
          }}
          sx={{
            p: 0.4,
            border: "1px solid rgba(255,255,255,0.12)",
            bgcolor: "rgba(255,255,255,0.03)",
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
            {initials || "D"}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={openProfile}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 240,
              borderRadius: 2,
              bgcolor: "#0f172a",
              color: "#e5e7eb",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={900} noWrap>
              {profile.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }} noWrap>
              {profile.email}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

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
