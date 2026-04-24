import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Mail,
  Power,
  PowerOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import Input from "../../../components/ui/Input";
import InviteUserDialog from "./InviteUserDialog.jsx";
import {
  deleteAdminUser,
  getAdminUsers,
  resendInvite,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../../services/api";

const ROLES = ["", "ADMIN", "MANAGER", "DEVELOPER", "CLIENT"];
const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Enabled", value: "true" },
  { label: "Disabled", value: "false" },
];

export default function UserList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [enabled, setEnabled] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetching = useRef(false);

  const enabledParam = useMemo(() => {
    if (enabled === "") return undefined;
    return enabled === "true";
  }, [enabled]);

  const loadUsers = async (overridePage = page) => {
    if (fetching.current) return;
    fetching.current = true;

    try {
      setLoading(true);
      setError("");

      const data = await getAdminUsers({
        q: q || undefined,
        role: role || undefined,
        enabled: enabledParam,
        page: overridePage - 1,
        size,
      });

      setItems(data?.items ?? []);
      setTotalPages(Math.max(data?.totalPages ?? 1, 1));
    } catch (e) {
      console.error(e);
      setError(extractError(e));
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, role, enabled, enabledParam]);

  const handleSearch = async () => {
    setPage(1);
    await loadUsers(1);
  };

  const handleClear = async () => {
    setQ("");
    setRole("");
    setEnabled("");
    setPage(1);
    setTimeout(() => loadUsers(1), 0);
  };

  const handleInviteSuccess = async (data) => {
    setMessage(
      data?.emailStatus === "PENDING"
        ? "Invite created successfully. Email is being handled after commit."
        : data?.message || "Invite created successfully."
    );
    await loadUsers();
  };

  const handleToggleStatus = async (user) => {
    const key = `status-${user.id}`;
    try {
      setActionLoading(key);
      setError("");
      setMessage("");

      await updateAdminUserStatus(user.id, !user.enabled);
      setMessage(`User ${!user.enabled ? "enabled" : "disabled"} successfully.`);
      await loadUsers();
    } catch (e) {
      setError(extractError(e));
    } finally {
      setActionLoading("");
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (!newRole || newRole === user.role) return;

    const key = `role-${user.id}`;
    try {
      setActionLoading(key);
      setError("");
      setMessage("");

      await updateAdminUserRole(user.id, newRole);
      setMessage("User role updated successfully.");
      await loadUsers();
    } catch (e) {
      setError(extractError(e));
    } finally {
      setActionLoading("");
    }
  };

  const handleResendInvite = async (user) => {
    const key = `invite-${user.id}`;
    try {
      setActionLoading(key);
      setError("");
      setMessage("");

      const res = await resendInvite(user.id);
      setMessage(res?.message || "Invite resent successfully.");
      await loadUsers();
    } catch (e) {
      setError(extractError(e));
    } finally {
      setActionLoading("");
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Delete user "${user.email}"?`);
    if (!confirmed) return;

    const key = `delete-${user.id}`;
    try {
      setActionLoading(key);
      setError("");
      setMessage("");

      await deleteAdminUser(user.id);
      setMessage("User deleted successfully.");
      await loadUsers();
    } catch (e) {
      setError(extractError(e));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: "32px",
          p: 3,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "radial-gradient(circle at top left, rgba(100,80,255,0.12), transparent 24%), linear-gradient(180deg, rgba(12,18,45,0.96), rgba(5,10,30,0.98))",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography sx={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>
              User Management
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
              Search, filter, invite, edit roles, enable, disable, and delete users.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={() => setInviteOpen(true)}
          >
            Invite User
          </Button>
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert severity="success" sx={{ whiteSpace: "pre-line" }}>
          {message}
        </Alert>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          borderRadius: "28px",
          p: 3,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
            <Input
              label="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <Input
              select
              label="Role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {ROLES.filter(Boolean).map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Input>

            <Input
              select
              label="Status"
              value={enabled}
              onChange={(e) => {
                setEnabled(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.label} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Input>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
            <Button variant="outlined" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="text" onClick={() => loadUsers()}>
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "28px",
          p: 2,
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(10,14,40,0.95), rgba(5,10,30,0.98))",
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Table
            sx={{
              minWidth: 1100,
              borderCollapse: "separate",
              borderSpacing: "0 10px",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>Loading users...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No users found.</TableCell>
                </TableRow>
              ) : (
                items.map((user) => {
                  const statusKey = `status-${user.id}`;
                  const roleKey = `role-${user.id}`;
                  const inviteKey = `invite-${user.id}`;
                  const deleteKey = `delete-${user.id}`;

                  return (
                    <TableRow key={user.id}>
                      <TableCell sx={tableCellLeft}>{user.name}</TableCell>
                      <TableCell sx={tableCellMid}>{user.email}</TableCell>

                      <TableCell sx={tableCellMid} width={220}>
                        <Input
                          select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          disabled={actionLoading === roleKey}
                        >
                          {ROLES.filter(Boolean).map((r) => (
                            <MenuItem key={r} value={r}>
                              {r}
                            </MenuItem>
                          ))}
                        </Input>
                      </TableCell>

                      <TableCell sx={tableCellMid}>
                        <Chip
                          label={user.enabled ? "Enabled" : "Disabled"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            color: user.enabled ? "#86efac" : "#fca5a5",
                            backgroundColor: user.enabled
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(239,68,68,0.12)",
                            border: user.enabled
                              ? "1px solid rgba(16,185,129,0.22)"
                              : "1px solid rgba(239,68,68,0.22)",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={tableCellMid}>
                        {formatDate(user.createdAt)}
                      </TableCell>

                      <TableCell sx={tableCellRight} align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                          flexWrap="wrap"
                        >
                          <Tooltip title={user.enabled ? "Disable User" : "Enable User"}>
                            <span>
                              <IconButton
                                onClick={() => handleToggleStatus(user)}
                                disabled={actionLoading === statusKey}
                              >
                                {user.enabled ? <PowerOff size={18} /> : <Power size={18} />}
                              </IconButton>
                            </span>
                          </Tooltip>

                          {!user.enabled ? (
                            <Tooltip title="Resend Invite">
                              <span>
                                <IconButton
                                  onClick={() => handleResendInvite(user)}
                                  disabled={actionLoading === inviteKey}
                                >
                                  <Mail size={18} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : null}

                          <Tooltip title="Delete User">
                            <span>
                              <IconButton
                                onClick={() => handleDelete(user)}
                                disabled={actionLoading === deleteKey}
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      </Paper>

      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInviteSuccess}
      />
    </Stack>
  );
}

function extractError(error) {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.fields) {
    return Object.entries(data.fields)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return error?.message || "Request failed";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const tableCellBase = {
  background: "rgba(255,255,255,0.03)",
  borderBottom: "none",
};

const tableCellLeft = {
  ...tableCellBase,
  borderTopLeftRadius: 16,
  borderBottomLeftRadius: 16,
  fontWeight: 700,
};

const tableCellMid = {
  ...tableCellBase,
};

const tableCellRight = {
  ...tableCellBase,
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
};