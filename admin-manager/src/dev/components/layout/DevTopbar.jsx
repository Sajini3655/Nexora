import React, { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { closeWithBlur } from "../../../utils/focus";

export default function DevTopbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const initials = (user?.name?.[0] || user?.email?.[0] || "D").toUpperCase();
  const roleLabel = user?.role || "DEVELOPER";

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        height: 86,
        px: { xs: 2, md: 3 },
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "var(--nx-panel)",
        borderBottom: "1px solid var(--nx-border)",
        boxShadow: "var(--nx-shadow)",
        borderRadius: "0 0 20px 20px",
      }}
    >
      <IconButton
        onClick={onMenuClick}
        sx={{
          width: 48,
          height: 48,
          color: "var(--nx-text)",
          border: "1px solid var(--nx-border)",
          background: "var(--nx-card)",
          "&:hover": {
            background: "color-mix(in srgb, var(--nx-purple) 12%, transparent)",
            borderColor: "color-mix(in srgb, var(--nx-purple) 30%, transparent)",
          },
        }}
      >
        <MenuIcon />
      </IconButton>

      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "var(--nx-purple)",
          boxShadow: "var(--nx-shadow)",
          flexShrink: 0,
        }}
      />

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 950,
            letterSpacing: -0.4,
            color: "var(--nx-text)",
            lineHeight: 1.1,
          }}
        >
          Nexora
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "var(--nx-muted)",
            fontWeight: 800,
            mt: 0.25,
          }}
        >
          Developer Workspace
        </Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      {user ? (
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
            px: 1.4,
            py: 0.8,
            borderRadius: 999,
            background: "var(--nx-card)",
            border: "1px solid var(--nx-border)",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 900, color: "var(--nx-text)" }}>
            {user.name || user.email || "Developer User"}
          </Typography>

          <Chip
            size="small"
            label={roleLabel}
            sx={{
              height: 24,
              fontWeight: 950,
              color: "var(--nx-purple)",
              background: "color-mix(in srgb, var(--nx-purple) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--nx-purple) 24%, transparent)",
            }}
          />
        </Box>
      ) : null}

      <IconButton
        sx={{
          width: 44,
          height: 44,
          color: "var(--nx-text)",
          border: "1px solid var(--nx-border)",
          background: "var(--nx-card)",
        }}
      >
        <NotificationsNoneIcon />
      </IconButton>

      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          p: 0.55,
          border: "1px solid color-mix(in srgb, var(--nx-purple) 28%, transparent)",
          background: "color-mix(in srgb, var(--nx-purple) 12%, transparent)",
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: "var(--nx-purple)",
            fontWeight: 950,
            color: "var(--nx-on-accent)",
          }}
        >
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => closeWithBlur(() => setAnchorEl(null))}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 230,
            borderRadius: 3,
            color: "var(--nx-text)",
            background: "var(--nx-panel)",
            border: "1px solid var(--nx-border)",
            boxShadow: "var(--nx-shadow)",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 950 }}>
            {user?.name || "Developer"}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>
            {user?.email || ""}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "var(--nx-border)" }} />

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate("/dev/profile");
          }}
        >
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            logout();
            navigate("/login");
          }}
        >
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
