import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  MenuItem,
  Alert,
  Button as MUIButton,
  Stack,
} from "@mui/material";

import Input from "../../../components/ui/Input";
import useApi from "../../../hooks/useApi";

const ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "CLIENT"];

function isValidEmail(value) {
  const e = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function extractErrorMessage(error) {
  const data = error?.response?.data;
  const status = error?.response?.status;

  console.error("Invite API status:", status);
  console.error("Invite API response data:", data);

  if (status === 401 || status === 403) {
    return "Your session expired. Please log in again.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("\n");
  }

  return error?.message || "Invite failed";
}

export default function InviteUserDialog({ open, onClose, onInvited }) {
  const api = useApi();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [warn, setWarn] = useState("");
  const [err, setErr] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && isValidEmail(email) && !!role;
  }, [name, email, role]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("CLIENT");
    setMsg("");
    setWarn("");
    setErr("");
    setInviteUrl("");
    setLoading(false);
    setSent(false);
    setCopied(false);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose?.();
  };

  async function handleInvite() {
    setErr("");
    setWarn("");
    setMsg("");
    setInviteUrl("");
    setCopied(false);

    if (!canSubmit || loading) return;

    try {
      setLoading(true);

      const res = await api.post("/admin/users/invite", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });

      const data = res?.data || {};

      setMsg(data.message || "Invite created successfully.");
      setInviteUrl(data.inviteUrl || "");

      if (data.emailStatus === "PENDING") {
        setWarn("Invite was saved. Email is being handled after database commit.");
      } else if (data.emailStatus === "FAILED") {
        setWarn(data.emailMessage || "Invite was created, but email sending failed.");
      }

      setSent(true);
      onInvited?.(data);
    } catch (e) {
      const message = extractErrorMessage(e);
      setErr(message);
      console.error("Invite failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setErr("Could not copy invite link.");
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
          backdropFilter: "blur(14px)",
        },
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

        {warn ? (
          <Alert severity="warning" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {warn}
          </Alert>
        ) : null}

        {msg ? (
          <Alert severity="success" sx={{ mb: 2, whiteSpace: "pre-line" }}>
            {msg}
          </Alert>
        ) : null}

        {inviteUrl ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>
              Invite link
            </Typography>

            <Box sx={{ wordBreak: "break-all", fontSize: 13, opacity: 0.9, mb: 1 }}>
              {inviteUrl}
            </Box>

            <Stack direction="row" spacing={1}>
              <MUIButton size="small" variant="contained" onClick={handleCopyLink}>
                {copied ? "Copied" : "Copy Link"}
              </MUIButton>
            </Stack>
          </Alert>
        ) : null}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Input
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={sent}
          />

          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!email && !isValidEmail(email)}
            helperText={email && !isValidEmail(email) ? "Enter a valid email address" : ""}
            disabled={sent}
          />

          <Input
            select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={sent}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Input>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!sent ? (
          <>
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
          </>
        ) : (
          <MUIButton variant="contained" onClick={handleClose}>
            OK
          </MUIButton>
        )}
      </DialogActions>
    </Dialog>
  );
}