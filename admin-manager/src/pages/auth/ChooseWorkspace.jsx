import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  BriefcaseBusiness,
  Code2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  getRolePath,
  getUserRoles,
  setActiveRole,
} from "../../utils/roleRouting";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function roleIcon(role) {
  if (role === "ADMIN") return <ShieldCheck size={24} />;
  if (role === "MANAGER") return <BriefcaseBusiness size={24} />;
  if (role === "DEVELOPER") return <Code2 size={24} />;
  return <UserRound size={24} />;
}

function roleTitle(role) {
  if (role === "ADMIN") return "Admin Workspace";
  if (role === "MANAGER") return "Manager Workspace";
  if (role === "DEVELOPER") return "Developer Workspace";
  if (role === "CLIENT") return "Client Workspace";
  return role;
}

function roleSubtitle(role) {
  if (role === "ADMIN") return "Manage users, roles, access, and system health.";
  if (role === "MANAGER") return "Manage projects, assign tasks, and project delivery.";
  if (role === "DEVELOPER") return "View assigned work, tasks, tickets, and project chats.";
  if (role === "CLIENT") return "Create tickets and follow your workstreams.";
  return "Open workspace.";
}

export default function ChooseWorkspace() {
  const navigate = useNavigate();

  const user = useMemo(() => getStoredUser(), []);
  const roles = useMemo(() => getUserRoles(user), [user]);

  const handleSelect = (role) => {
    setActiveRole(role);
    navigate(getRolePath(role, user), { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 4,
        color: "var(--nx-text)",
        background: "var(--nx-bg)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 900,
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          background: "var(--nx-card)",
          border: "1px solid var(--nx-border)",
          boxShadow: "var(--nx-shadow)",
        }}
      >
        <Stack spacing={1.2} alignItems="center" textAlign="center" sx={{ mb: 4 }}>
          <Chip
            label="Nexora"
            sx={{
              color: "var(--nx-purple)",
              fontWeight: 900,
              backgroundColor: "color-mix(in srgb, var(--nx-purple) 14%, transparent)",
              border: "1px solid color-mix(in srgb, var(--nx-purple) 28%, transparent)",
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 950,
              letterSpacing: -1,
              color: "var(--nx-text)",
            }}
          >
            Choose your workspace
          </Typography>

          <Typography sx={{ color: "var(--nx-muted)", maxWidth: 620 }}>
            Your account has more than one role. Select how you want to continue.
          </Typography>

          <Typography sx={{ color: "var(--nx-text-soft)", fontWeight: 800 }}>
            {user?.name || user?.email || "User"}
          </Typography>
        </Stack>

        {roles.length === 0 ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ color: "var(--nx-red)", mb: 2 }}>
              No roles were found for this account.
            </Typography>

            <Button variant="contained" onClick={() => navigate("/login", { replace: true })}>
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: roles.length === 1 ? "1fr" : "repeat(2, 1fr)",
              },
              gap: 2,
            }}
          >
            {roles.map((role) => (
              <Paper
                key={role}
                component="button"
                type="button"
                onClick={() => handleSelect(role)}
                elevation={0}
                sx={{
                  textAlign: "left",
                  p: 2.5,
                  borderRadius: 3,
                  cursor: "pointer",
                  color: "var(--nx-text)",
                  background: "var(--nx-panel)",
                  border: "1px solid var(--nx-border)",
                  transition: "180ms ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    background: "color-mix(in srgb, var(--nx-purple) 14%, transparent)",
                    borderColor: "color-mix(in srgb, var(--nx-purple) 45%, transparent)",
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2.5,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--nx-purple)",
                      backgroundColor: "color-mix(in srgb, var(--nx-purple) 14%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--nx-purple) 25%, transparent)",
                      flexShrink: 0,
                    }}
                  >
                    {roleIcon(role)}
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 950, fontSize: 18, color: "var(--nx-text)" }}>
                      {roleTitle(role)}
                    </Typography>

                    <Typography sx={{ color: "var(--nx-muted)", mt: 0.6, fontSize: 14 }}>
                      {roleSubtitle(role)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

