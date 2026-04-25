import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  ListItemText,
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

const ROLES = ["ADMIN", "MANAGER", "DEVELOPER", "CLIENT"];

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

  const handleRoleChange = async (user, newRoles) => {
    const selectedRoles = Array.isArray(newRoles)
      ? newRoles.filter(Boolean)
      : [newRoles].filter(Boolean);

    if (selectedRoles.length === 0) {
      setError("At least one role must be selected.");
      return;
    }

    const currentRoles = getUserRoles(user);

    const same =
      selectedRoles.length === currentRoles.length &&
      selectedRoles.every((r) => currentRoles.includes(r));

    if (same) return;

    const key = `role-${user.id}`;

    try {
      setActionLoading(key);
      setError("");
      setMessage("");

      await updateAdminUserRole(user.id, { role: selectedRoles[0], roles: selectedRoles });
      setMessage("User roles updated successfully.");
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
          background: "#0b1628",
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
              {ROLES.map((r) => (
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
          background: "#0b1628",
        }}
      >
        <Box
          sx={{
            maxHeight: "560px",
            overflow: "auto",
            pr: 0.5,
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(124,92,255,0.55)",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(124,92,255,0.8)",
            },
          }}
        >
          <Table
            stickyHeader
            sx={{
              minWidth: 1100,
              borderCollapse: "separate",
              borderSpacing: "0 10px",
              "& .MuiTableCell-stickyHeader": {
                backgroundColor: "#0b1628",
                color: "#cbd5e1",
                zIndex: 2,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>Name</TableCell>
                <TableCell sx={headCell}>Email</TableCell>
                <TableCell sx={headCell}>Roles</TableCell>
                <TableCell sx={headCell}>Status</TableCell>
                <TableCell sx={headCell}>Created</TableCell>
                <TableCell sx={headCell} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={tableEmptyCell}>
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={tableEmptyCell}>
                    No users found.
                  </TableCell>
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

                      <TableCell sx={tableCellMid} width={260}>
                        <RoleMultiSelect
                          value={getUserRoles(user)}
                          disabled={actionLoading === roleKey}
                          onChange={(newRoles) => handleRoleChange(user, newRoles)}
                        />
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
                          flexWrap="nowrap"
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

function getUserRoles(user) {
  if (Array.isArray(user?.roles)) return user.roles.filter(Boolean);
  if (Array.isArray(user?.roleNames)) return user.roleNames.filter(Boolean);
  if (typeof user?.role === "string" && user.role.trim()) return [user.role.trim()];
  return [];
}

function RoleMultiSelect({ value, disabled, onChange }) {
  const selected = Array.isArray(value) ? value : [];

  return (
    <Input
      select
      value={selected}
      disabled={disabled}
      onChange={(e) => {
        const nextValue = e.target.value;
        onChange(typeof nextValue === "string" ? nextValue.split(",") : nextValue);
      }}
      SelectProps={{
        multiple: true,
        renderValue: (selectedValues) =>
          Array.isArray(selectedValues) && selectedValues.length > 0
            ? selectedValues.join(", ")
            : "Select roles",
        MenuProps: {
          PaperProps: {
            sx: {
              mt: 1,
              backgroundColor: "#020617",
              color: "#ffffff",
              border: "1px solid rgba(124,92,255,0.35)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.75)",
              borderRadius: 2,
              maxHeight: 320,
              "& .MuiMenuItem-root": {
                backgroundColor: "#020617",
                color: "#ffffff",
                fontWeight: 800,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              },
              "& .MuiMenuItem-root:hover": {
                backgroundColor: "rgba(124,92,255,0.22)",
              },
              "& .MuiMenuItem-root.Mui-selected": {
                backgroundColor: "rgba(124,92,255,0.34)",
              },
              "& .MuiMenuItem-root.Mui-selected:hover": {
                backgroundColor: "rgba(124,92,255,0.45)",
              },
              "& .MuiCheckbox-root": {
                color: "#94a3b8",
              },
              "& .MuiCheckbox-root.Mui-checked": {
                color: "#8b5cf6",
              },
            },
          },
        },
      }}
      sx={{
        minWidth: 220,
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#020617",
          borderRadius: "999px",
          color: "#ffffff",
        },
        "& .MuiSelect-select": {
          color: "#ffffff",
          fontWeight: 800,
          py: 1.1,
        },
        "& fieldset": {
          borderColor: "rgba(124,92,255,0.35)",
        },
        "&:hover fieldset": {
          borderColor: "rgba(124,92,255,0.75)",
        },
      }}
    >
      {ROLES.map((role) => (
        <MenuItem key={role} value={role}>
          <Checkbox checked={selected.includes(role)} />
          <ListItemText primary={role} />
        </MenuItem>
      ))}
    </Input>
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

const headCell = {
  fontWeight: 900,
  color: "#cbd5e1",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
};

const tableCellBase = {
  background: "rgba(255,255,255,0.03)",
  borderBottom: "none",
  whiteSpace: "nowrap",
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

const tableEmptyCell = {
  color: "#94a3b8",
  borderBottom: "none",
  py: 4,
};


