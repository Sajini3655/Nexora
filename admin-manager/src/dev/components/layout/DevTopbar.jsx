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
        background:
          "linear-gradient(135deg, rgba(53,56,93,0.96) 0%, rgba(15,23,42,0.98) 55%, rgba(8,47,56,0.88) 100%)",
        borderBottom: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.30)",
        backdropFilter: "blur(18px)",
        borderRadius: "0 0 24px 24px",
      }}
    >
      <IconButton
        onClick={onMenuClick}
        sx={{
          width: 48,
          height: 48,
          color: "#e5e7eb",
          border: "1px solid rgba(255,255,255,0.13)",
          background: "rgba(255,255,255,0.045)",
          "&:hover": {
            background: "rgba(124,92,255,0.16)",
            borderColor: "rgba(167,139,250,0.28)",
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
          background: "linear-gradient(135deg, #7c5cff, #38bdf8)",
          boxShadow: "0 14px 34px rgba(56,189,248,0.18)",
          flexShrink: 0,
        }}
      />

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 950,
            letterSpacing: -0.4,
            color: "#f8fafc",
            lineHeight: 1.1,
          }}
        >
          Nexora
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#94a3b8",
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
            background: "rgba(255,255,255,0.045)",
            border: "1px solid rgba(148,163,184,0.13)",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 900, color: "#e5e7eb" }}>
            {user.name || user.email || "Developer User"}
          </Typography>

          <Chip
            size="small"
            label={roleLabel}
            sx={{
              height: 24,
              fontWeight: 950,
              color: "#ddd6fe",
              background: "rgba(124,92,255,0.20)",
              border: "1px solid rgba(167,139,250,0.26)",
            }}
          />
        </Box>
      ) : null}

      <IconButton
        sx={{
          width: 44,
          height: 44,
          color: "#e5e7eb",
          border: "1px solid rgba(148,163,184,0.14)",
          background: "rgba(255,255,255,0.035)",
        }}
      >
        <NotificationsNoneIcon />
      </IconButton>

      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          p: 0.55,
          border: "1px solid rgba(167,139,250,0.32)",
          background: "rgba(124,92,255,0.12)",
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: "#6d5dfc",
            fontWeight: 950,
            color: "#fff",
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
            mt: 1,
            minWidth: 230,
            borderRadius: 3,
            color: "#e5e7eb",
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.18)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 950 }}>
            {user?.name || "Developer"}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            {user?.email || ""}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

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
