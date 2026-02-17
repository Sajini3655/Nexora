import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  MenuItem,
  Alert,
  Button as MUIButton
} from "@mui/material";

import Input from "../../components/ui/Input";
import useApi from "../../hooks/useApi";

const ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "CLIENT"];

function isValidEmail(value) {
  const e = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ✅ prevents "/api/api/..." no matter what baseURL is
function normalizeInvitePath(apiInstance) {
  const base = (apiInstance?.defaults?.baseURL || "").replace(/\/+$/, "");
  const hasApiSuffix = /\/api$/i.test(base);
  return hasApiSuffix ? "/admin/users/invite" : "/api/admin/users/invite";
}

export default function InviteUserDialog({ open, onClose, onInvited }) {
  const api = useApi();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && isValidEmail(email) && !!role;
  }, [name, email, role]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("CLIENT");
    setMsg("");
    setErr("");
    setInviteUrl("");
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose?.();
  };

  async function handleInvite() {
    setErr("");
    setMsg("");
    setInviteUrl("");

    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      const path = normalizeInvitePath(api);

      const res = await api.post(path, {
        name: name.trim(),
        email: email.trim(),
        role
      });

      const data = res?.data || {};
      setMsg(data.message || "User invited.");
      if (data.inviteUrl) setInviteUrl(data.inviteUrl);

      onInvited?.({ name: name.trim(), email: email.trim(), role });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Invite failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(15,18,35,0.92)",
          backdropFilter: "blur(14px)"
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
          Invite User
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Send an invitation to a new user.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {err ? (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {err}
          </Alert>
        ) : null}

        {msg ? (
          <Alert severity="success" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {msg}
          </Alert>
        ) : null}

        {inviteUrl ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Invite link (copy & share if email fails):
            <Box sx={{ mt: 1, wordBreak: "break-all", fontSize: 13, opacity: 0.9 }}>
              {inviteUrl}
            </Box>
          </Alert>
        ) : null}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Input
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!email && !isValidEmail(email)}
            helperText={email && !isValidEmail(email) ? "Enter a valid email (example@gmail.com)" : ""}
          />

          <Input
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Input>

          <Typography variant="caption" sx={{ opacity: 0.65 }}>
            Tip: Keep CLIENT as default. Give ADMIN only when required.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <MUIButton variant="outlined" onClick={handleClose} disabled={loading}>
          Cancel
        </MUIButton>

        <MUIButton
          variant="contained"
          onClick={handleInvite}
          disabled={!canSubmit || loading}
        >
          {loading ? "Sending..." : "Send Invite"}
        </MUIButton>
      </DialogActions>
    </Dialog>
  );
}
