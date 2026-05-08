import React from "react";
import { Alert, Box, Button, IconButton, Snackbar, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { getActiveRole, getUserRoles } from "../../utils/roleRouting";
import { resolveNlqNavigation } from "../../services/api";

function roleFromPathname(pathname) {
  const path = String(pathname || "");
  if (path.startsWith("/dev")) return "DEVELOPER";
  if (path.startsWith("/client")) return "CLIENT";
  if (path.startsWith("/manager")) return "MANAGER";
  if (path.startsWith("/admin") || path === "/access" || path === "/settings") return "ADMIN";
  if (path.startsWith("/admin/")) return "ADMIN";
  return "";
}

function buildSwitchRoleMessage(targetRole, hasMultipleRoles) {
  const roleLabel = String(targetRole || "").toUpperCase();
  if (!roleLabel) return "Switch roles to access that page.";
  return hasMultipleRoles
    ? `That page is in the ${roleLabel} workspace. Switch role to continue.`
    : `That page is for ${roleLabel} users.`;
}

export default function NLQNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const currentRole = roleFromPathname(location.pathname) || getActiveRole(user) || user?.role || "";
  const roles = getUserRoles(user);
  const hasMultipleRoles = roles.length > 1;

  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [snack, setSnack] = React.useState({ open: false, severity: "info", message: "", action: null });

  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  const showMessage = (message, severity = "info", action = null) => {
    setSnack({ open: true, severity, message, action });
  };

  const onSubmit = async () => {
    const raw = value.trim();
    if (!raw) return;

    setBusy(true);
    try {
      const result = await resolveNlqNavigation({ query: raw, currentRole });
      const action = String(result?.action || "").toUpperCase();

      if (action === "NAVIGATE" && result?.path) {
        navigate(result.path);
        setValue("");
        return;
      }

      if (action === "SWITCH_ROLE") {
        const target = String(result?.targetRole || "").toUpperCase();
        const canSwitch = roles.includes(target);
        showMessage(
          canSwitch
            ? buildSwitchRoleMessage(target, hasMultipleRoles)
            : "You don’t have permission to access that workspace.",
          canSwitch ? "info" : "warning",
          canSwitch && hasMultipleRoles
            ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  closeSnack();
                  navigate("/choose-workspace");
                }}
              >
                Switch role
              </Button>
            )
            : null
        );
        return;
      }

      if (action === "MESSAGE") {
        showMessage(result?.message || "Try a page name like “dashboard”, “projects”, or “tickets”.", "info");
        return;
      }

      showMessage("Try a page name like “dashboard”, “projects”, or “tickets”.", "info");
    } catch (err) {
      showMessage(err?.message || "NLQ navigation failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <TextField
          size="small"
          value={value}
          inputProps={{ "aria-label": "Natural language navigation", id: "nlq-search-input" }}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Go to…"
          disabled={busy}
          sx={{
            width: { xs: 160, sm: 240, md: 340 },
            "& .MuiInputBase-root": {
              background: "rgba(255,255,255,0.03)",
              borderRadius: 999,
            },
          }}
        />

        <IconButton
          onClick={onSubmit}
          disabled={busy}
          sx={{
            width: 42,
            height: 42,
            color: "#e5e7eb",
            border: "1px solid rgba(148,163,184,0.12)",
            background: "rgba(255,255,255,0.03)",
            "&:hover": { background: "rgba(255,255,255,0.06)" },
          }}
          aria-label="Submit navigation query"
        >
          <SearchRoundedIcon />
        </IconButton>
      </Box>

      <Snackbar
        open={snack.open}
        onClose={closeSnack}
        autoHideDuration={5200}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          sx={{ width: "100%" }}
          action={snack.action}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
