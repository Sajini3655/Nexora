import React, { useEffect, useMemo, useState } from "react";
import InviteUserDialog from "./InviteUserDialog.jsx";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Stack,
  InputAdornment,
  Alert
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";

import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import useApi from "../../hooks/useApi";

const ROLES = ["ALL", "ADMIN", "MANAGER", "DEVELOPER", "CLIENT"];
const STATUSES = ["ALL", "ACTIVE", "DISABLED"];

function RoleChip({ role }) {
  return (
    <Chip
      size="small"
      label={role}
      variant="outlined"
      sx={{
        opacity: 0.9,
        borderColor:
          role === "ADMIN"
            ? "rgba(124,92,255,0.45)"
            : role === "MANAGER"
            ? "rgba(34,197,94,0.35)"
            : "rgba(255,255,255,0.18)"
      }}
    />
  );
}

function StatusChip({ enabled }) {
  const active = Boolean(enabled);
  return (
    <Chip
      size="small"
      label={active ? "ACTIVE" : "DISABLED"}
      variant="outlined"
      sx={{
        borderColor: active ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.40)",
        backgroundColor: active ? "rgba(34,197,94,0.10)" : "rgba(245,158,11,0.10)"
      }}
    />
  );
}

export default function UserList() {
  const api = useApi();

  // UI state
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  // server pagination
  const [page, setPage] = useState(0); // backend is 0-based
  const [size] = useState(20);

  // data state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);

  // row menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  const openMenu = (e, user) => {
    setAnchorEl(e.currentTarget);
    setMenuUser(user);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const enabledParam = useMemo(() => {
    if (status === "ALL") return undefined;
    return status === "ACTIVE";
  }, [status]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const params = {
        page,
        size
      };

      // backend expects role="ALL" or a role name
      if (q.trim()) params.q = q.trim();
      if (role && role !== "ALL") params.role = role;
      if (enabledParam !== undefined) params.enabled = enabledParam;

      // FIXED: Removed /api prefix (baseURL already has it)
      const res = await api.get("/admin/users", { params });
      setRows(res.data.items || []);
      setTotal(res.data.total ?? 0);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load users");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // reload when filters/page change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, role, status]);

  // for q, debounce a little
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function handleToggleStatus(user) {
    closeMenu();
    const nextEnabled = !user.enabled;

    try {
      // FIXED: Removed /api prefix
      await api.patch(`/admin/users/${user.id}/status`, { enabled: nextEnabled });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update user status");
    }
  }

  async function handleDelete(user) {
    closeMenu();
    const ok = window.confirm(`Delete user ${user.email}? This cannot be undone.`);
    if (!ok) return;

    try {
      // FIXED: Removed /api prefix
      await api.delete(`/admin/users/${user.id}`);
      // if last item on page got deleted, move back
      if (rows.length === 1 && page > 0) setPage((p) => p - 1);
      else await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete user");
    }
  }

  // You can wire this to your InviteUserDialog submit later
  async function handleInvite(payload) {
    // payload expected: { name, email, role }
    setErr("");
    try {
      // FIXED: Removed /api prefix
      const res = await api.post("/admin/users/invite", payload);
      // show invite URL
      const inviteUrl = res.data?.inviteUrl;
      if (inviteUrl) {
        window.prompt("Invite link (copy and send):", inviteUrl);
      }
      setInviteOpen(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Invite failed");
    }
  }

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage users, roles, and account status."
        crumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}
        right={
          <Stack direction="row" spacing={1}>
            <Button
              tone="soft"
              startIcon={<RefreshIcon />}
              onClick={() => load()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
          </Stack>
        }
      />

      {err ? <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert> : null}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Input
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <Input
            select
            label="Role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Input>

          <Input
            select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 220 }}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Input>

          <Box sx={{ flexGrow: 1 }} />

          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {total} result{total === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </Card>

      {/* Table */}
      <Card sx={{ p: 0 }}>
        {loading ? (
          <Spinner />
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "28%" }}>Name</TableCell>
                  <TableCell sx={{ width: "34%" }}>Email</TableCell>
                  <TableCell sx={{ width: "12%" }}>Role</TableCell>
                  <TableCell sx={{ width: "12%" }}>Status</TableCell>
                  <TableCell sx={{ width: "14%" }}>Created</TableCell>
                  <TableCell align="right" sx={{ width: 60 }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ p: 3, textAlign: "center" }}>
                        <Typography sx={{ fontWeight: 900 }}>No users found</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Try changing filters or search terms.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 900 }}>{u.name}</TableCell>
                      <TableCell sx={{ opacity: 0.85 }}>{u.email}</TableCell>
                      <TableCell>
                        <RoleChip role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusChip enabled={u.enabled} />
                      </TableCell>
                      <TableCell sx={{ opacity: 0.75 }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={(e) => openMenu(e, u)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider />

        {/* Pagination */}
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap"
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Page {page + 1} of {totalPages}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              tone="soft"
              disabled={loading || page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <Button
              tone="soft"
              disabled={loading || page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Row Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15,18,35,0.92)",
            backdropFilter: "blur(14px)"
          }
        }}
      >
        <MenuItem
          onClick={() => {
            closeMenu();
            alert(`View user: ${menuUser?.email} (you can add a /users/:id page later)`);
          }}
        >
          View
        </MenuItem>

        <MenuItem onClick={() => handleToggleStatus(menuUser)}>
          {menuUser?.enabled ? "Disable" : "Enable"}
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleDelete(menuUser)} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Invite Dialog */}
      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInvite}
      />
    </Box>
  );
}