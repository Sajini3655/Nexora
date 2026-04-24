import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Divider,
  Chip,
  Alert,
  Stack,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import useApi from "../../../hooks/useApi.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function AdminProfile() {
  const { user } = useAuth();
  const api = useApi();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) {
      return "U";
    }
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }, [user?.name]);

  const roleLabel = useMemo(() => {
    const role = user?.role || "USER";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }, [user?.role]);

  const createdAtLabel = useMemo(() => {
    if (!user?.createdAt) {
      return "-";
    }

    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString();
  }, [user?.createdAt]);

  async function handleChangePassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Fill all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
        My Profile
      </Typography>
      <Typography sx={{ opacity: 0.72, mb: 3 }}>
        Manage your account details and security settings.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  width: 62,
                  height: 62,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 22,
                  color: "#e8e8ff",
                  background: "linear-gradient(135deg, rgba(74,134,255,0.6), rgba(95,52,230,0.6))",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {initials}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
                  {user?.name || "-"}
                </Typography>
                <Typography sx={{ opacity: 0.75 }}>{user?.email || "-"}</Typography>
              </Box>
            </Stack>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip icon={<PersonOutlineIcon />} label={roleLabel} />
              <Chip
                icon={<CheckCircleOutlineIcon />}
                color={user?.enabled ? "success" : "default"}
                label={user?.enabled ? "Account Active" : "Account Disabled"}
              />
            </Box>
          </Card>

          <Card>
            <Typography fontWeight={800} sx={{ mb: 2 }}>
              Account Information
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Info label="User ID" value={user?.id} />
            <Info label="Name" value={user?.name} />
            <Info label="Email" value={user?.email} />
            <Info label="Role" value={roleLabel} />
            <Info label="Joined" value={createdAtLabel} />
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card component="form" onSubmit={handleChangePassword}>
            <Typography fontWeight={800} sx={{ mb: 2 }}>
              Security
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>
              Change your account password. Use a strong password with at least 6 characters.
            </Typography>

            {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
            {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

            <Stack spacing={1.5}>
              <Input
                type="password"
                label="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                type="password"
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Stack>

            <Button
              type="submit"
              loading={loading}
              sx={{ mt: 2, width: "100%" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LockOutlinedIcon fontSize="small" />
                <span>Update Password</span>
              </Box>
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography fontWeight={700}>{value || "-"}</Typography>
    </Box>
  );
}
