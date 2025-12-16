import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  MenuItem,
  Alert
} from "@mui/material";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "CLIENT"];

export default function InviteUserDialog({ open, onClose, onInvited }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const canSubmit = useMemo(() => {
    const e = email.trim();
    return name.trim().length >= 2 && e.includes("@") && e.includes(".") && role;
  }, [name, email, role]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("CLIENT");
    setMsg("");
    setErr("");
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
    if (!canSubmit) return;

    try {
      setLoading(true);

      // TODO: connect backend later:
      // await api.post("/api/admin/invite", { name, email, role });

      // fake delay
      await new Promise((r) => setTimeout(r, 450));

      setMsg("Invitation prepared. (Connect backend to send email.)");
      onInvited?.({ name: name.trim(), email: email.trim(), role });
    } catch (e) {
      setErr(e?.response?.data?.message || "Invite failed");
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
          Create an invitation for a new Nexora user.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}
        {msg ? <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert> : null}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <Input select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
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
        <Button tone="soft" onClick={handleClose}>
          Cancel
        </Button>
        <Button loading={loading} disabled={!canSubmit} onClick={handleInvite}>
          Send Invite
        </Button>
      </DialogActions>
    </Dialog>
  );
}
