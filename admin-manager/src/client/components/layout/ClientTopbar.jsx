import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";

import { useAuth } from "../../../context/AuthContext.jsx";

export default function ClientTopbar({ onMenuClick, onToggleSidebar }) {
  const { user } = useAuth();

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Client";

  const initials = getInitials(displayName);

  const handleMenuClick = onMenuClick || onToggleSidebar;

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        px: { xs: 1.5, sm: 2, md: 3 },
        pt: { xs: 1, md: 1.2 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: { xs: 76, md: 82 },
          px: { xs: 2, sm: 3, md: 4 },
          py: 1.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderRadius: "28px",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(17, 24, 39, 0.74))",
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          boxShadow:
            "0 22px 70px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Left side */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
          <Tooltip title="Open navigation">
            <IconButton
              onClick={handleMenuClick}
              sx={{
                width: 52,
                height: 52,
                borderRadius: "18px",
                color: "#e5e7eb",
                border: "1px solid rgba(255,255,255,0.14)",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                "&:hover": {
                  background:
                    "linear-gradient(145deg, rgba(124,92,255,0.28), rgba(96,165,250,0.12))",
                  borderColor: "rgba(167,139,250,0.42)",
                },
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: "20px",
              position: "relative",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              background:
                "conic-gradient(from 180deg, #7c5cff, #60a5fa, #22d3ee, #7c5cff)",
              boxShadow:
                "0 16px 45px rgba(96,165,250,0.26), 0 10px 28px rgba(124,92,255,0.28)",
              border: "1px solid rgba(255,255,255,0.22)",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 7,
                borderRadius: "15px",
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45), transparent 26%), linear-gradient(135deg, rgba(15,23,42,0.2), rgba(15,23,42,0.45))",
              },
            }}
          >
            <Typography
              sx={{
                position: "relative",
                zIndex: 1,
                fontWeight: 950,
                fontSize: 18,
                letterSpacing: -0.8,
                color: "#ffffff",
              }}
            >
              N
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 950,
                fontSize: { xs: 18, sm: 20 },
                lineHeight: 1,
                letterSpacing: -0.8,
                color: "#f8fafc",
              }}
            >
              Nexora
            </Typography>

            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                mt: 0.45,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: "rgba(203,213,225,0.68)",
              }}
            >
              Client Workspace
            </Typography>
          </Box>
        </Stack>

        {/* Right side */}
        <Stack direction="row" spacing={1.3} alignItems="center" sx={{ flexShrink: 0 }}>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
              px: 1.2,
              py: 0.7,
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(15, 23, 42, 0.56)",
            }}
          >
            <Typography
              sx={{
                maxWidth: 130,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
                fontWeight: 900,
                color: "#f8fafc",
              }}
            >
              {displayName}
            </Typography>

            <Chip
              label="CLIENT"
              size="small"
              sx={{
                height: 26,
                fontSize: 11,
                fontWeight: 950,
                color: "#dbeafe",
                border: "1px solid rgba(147,197,253,0.26)",
                background:
                  "linear-gradient(135deg, rgba(96,165,250,0.22), rgba(124,92,255,0.20))",
              }}
            />
          </Box>

          <Tooltip title="Notifications">
            <IconButton
              sx={{
                width: 48,
                height: 48,
                borderRadius: "17px",
                color: "#e5e7eb",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(15, 23, 42, 0.52)",
                "&:hover": {
                  background: "rgba(124,92,255,0.18)",
                  borderColor: "rgba(167,139,250,0.38)",
                },
              }}
            >
              <Badge
                variant="dot"
                overlap="circular"
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: "#22c55e",
                    boxShadow: "0 0 0 3px rgba(34,197,94,0.16)",
                  },
                }}
              >
                <NotificationsNoneRoundedIcon sx={{ fontSize: 25 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Avatar
            sx={{
              width: 52,
              height: 52,
              fontSize: 17,
              fontWeight: 950,
              color: "#ffffff",
              border: "3px solid rgba(255,255,255,0.18)",
              background:
                "linear-gradient(135deg, #7c5cff 0%, #4f46e5 48%, #60a5fa 100%)",
              boxShadow:
                "0 14px 36px rgba(124,92,255,0.38), inset 0 1px 0 rgba(255,255,255,0.28)",
            }}
          >
            {initials}
          </Avatar>
        </Stack>
      </Box>
    </Box>
  );
}

function getInitials(name) {
  return String(name || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}