import React, { useMemo, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  MenuItem,
  Chip,
  Stack
} from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

/**
 * Demo model
 * Later endpoints:
 * - GET /api/access/modules
 * - GET /api/access/roles
 * - GET /api/access/role-matrix
 * - GET /api/access/users?role=CLIENT
 * - GET /api/access/user-overrides?userId=...
 * - PUT /api/access/role-matrix
 * - PUT /api/access/user-overrides
 */

const MODULES = [
  { key: "DASHBOARD", label: "Dashboard", desc: "Basic overview access" },
  { key: "TASKS", label: "Tasks", desc: "Task workflows and boards" },
  { key: "CHAT", label: "Chat", desc: "Messaging and announcements" },
  { key: "FILES", label: "Files", desc: "Uploads and downloads" },
  { key: "REPORTS", label: "Reports", desc: "Exports and analytics" }
];

const ROLES = ["MANAGER", "DEVELOPER", "CLIENT"];

// Demo users for overrides (you can later fetch from /api/users)
const demoUsers = [
  { id: 1, name: "Client A", email: "client@nexora.com", role: "CLIENT" },
  { id: 2, name: "Client B", email: "client2@nexora.com", role: "CLIENT" },
  { id: 3, name: "Dev B", email: "dev@nexora.com", role: "DEVELOPER" }
];

function Pill({ label }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        background: "rgba(124,92,255,0.16)",
        border: "1px solid rgba(124,92,255,0.25)"
      }}
    />
  );
}

export default function AccessControl() {
  const [tab, setTab] = useState(0);

  // Role Matrix state
  const [roleAccess, setRoleAccess] = useState(() => {
    const init = {};
    for (const r of ROLES) {
      init[r] = {};
      for (const m of MODULES) {
        // sensible defaults:
        // - managers/devs: mostly true
        // - clients: only dashboard + chat by default
        init[r][m.key] = r === "CLIENT" ? ["DASHBOARD", "CHAT"].includes(m.key) : true;
      }
    }
    return init;
  });

  // User Overrides state (null=inherit, true=allow, false=deny)
  const [selectedUserId, setSelectedUserId] = useState(demoUsers[0].id);
  const selectedUser = useMemo(
    () => demoUsers.find((u) => u.id === selectedUserId),
    [selectedUserId]
  );

  const [overrides, setOverrides] = useState(() => {
    const init = {};
    for (const u of demoUsers) {
      init[u.id] = {};
      for (const m of MODULES) init[u.id][m.key] = null;
    }
    // demo example: allow FILES for Client A even if role denies
    init[1]["FILES"] = true;
    // demo example: deny CHAT for Dev B
    init[3]["CHAT"] = false;
    return init;
  });

  const toggleRole = (role, moduleKey) => {
    setRoleAccess((prev) => ({
      ...prev,
      [role]: { ...prev[role], [moduleKey]: !prev[role][moduleKey] }
    }));
  };

  const setOverride = (userId, moduleKey, value) => {
    setOverrides((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [moduleKey]: value }
    }));
  };

  const effectiveAccess = (user, moduleKey) => {
    const o = overrides[user.id]?.[moduleKey];
    if (o === true || o === false) return o;
    return Boolean(roleAccess[user.role]?.[moduleKey]);
  };

  const summary = useMemo(() => {
    // quick premium summary for selected user
    if (!selectedUser) return { allowed: 0, denied: 0 };
    let allowed = 0;
    let denied = 0;
    for (const m of MODULES) {
      effectiveAccess(selectedUser, m.key) ? allowed++ : denied++;
    }
    return { allowed, denied };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, roleAccess, overrides]);

  return (
    <Box>
      <PageHeader
        title="Access Control"
        subtitle="Define module access by role, and override per user (especially for clients)."
        right={
          <Button variant="outlined" onClick={() => alert("Hook this to backend later")}>
            Save Changes
          </Button>
        }
      />

      <Card sx={{ p: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Role Matrix" />
          <Tab label="User Overrides" />
        </Tabs>

        <Divider sx={{ mb: 2 }} />

        {tab === 0 ? (
          <RoleMatrix
            roleAccess={roleAccess}
            onToggleRole={toggleRole}
          />
        ) : (
          <UserOverrides
            users={demoUsers}
            modules={MODULES}
            roleAccess={roleAccess}
            overrides={overrides}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            setOverride={setOverride}
            summary={summary}
          />
        )}
      </Card>
    </Box>
  );
}

function RoleMatrix({ roleAccess, onToggleRole }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <SecurityIcon />
        <Typography sx={{ fontWeight: 900 }}>Role Matrix</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Pill label="Role-based defaults" />
      </Stack>

      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
        These are default permissions for each role. Use User Overrides for exceptions.
      </Typography>

      <Grid container spacing={2.5}>
        {MODULES.map((m) => (
          <Grid item xs={12} key={m.key}>
            <Card sx={{ p: 2.25 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900 }}>{m.label}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {m.desc}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {ROLES.map((r) => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Switch
                          checked={Boolean(roleAccess[r][m.key])}
                          onChange={() => onToggleRole(r, m.key)}
                        />
                      }
                      label={`${r}: ${roleAccess[r][m.key] ? "On" : "Off"}`}
                      sx={{ m: 0 }}
                    />
                  ))}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function UserOverrides({
  users,
  modules,
  roleAccess,
  overrides,
  selectedUserId,
  setSelectedUserId,
  setOverride,
  summary
}) {
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const effectiveAccess = (user, moduleKey) => {
    const o = overrides[user.id]?.[moduleKey];
    if (o === true || o === false) return o;
    return Boolean(roleAccess[user.role]?.[moduleKey]);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <SecurityIcon />
        <Typography sx={{ fontWeight: 900 }}>User Overrides</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Pill label="Exceptions only" />
      </Stack>

      <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
        Choose a user and override access per module. “Inherit” uses role matrix.
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Input
          select
          label="Select User"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          sx={{ width: 360 }}
        >
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name} ({u.role})
            </MenuItem>
          ))}
        </Input>

        <Card sx={{ p: 2, flex: 1, minWidth: 260 }}>
          <Typography sx={{ fontWeight: 900 }}>
            {selectedUser?.name}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {selectedUser?.email} • role: {selectedUser?.role}
          </Typography>

          <Divider sx={{ my: 1.25 }} />

          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip size="small" label={`Allowed: ${summary.allowed}`} />
            <Chip size="small" variant="outlined" label={`Denied: ${summary.denied}`} />
          </Box>
        </Card>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2.5}>
        {modules.map((m) => {
          const overrideVal = overrides[selectedUserId]?.[m.key]; // null/true/false
          const eff = selectedUser ? effectiveAccess(selectedUser, m.key) : false;

          return (
            <Grid key={m.key} item xs={12} md={6}>
              <Card sx={{ p: 2.25 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 900 }}>{m.label}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      Effective: {eff ? "Allowed" : "Denied"}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={overrideVal === null ? "Inherited" : overrideVal ? "Forced Allow" : "Forced Deny"}
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={overrideVal === null ? "contained" : "outlined"}
                    onClick={() => setOverride(selectedUserId, m.key, null)}
                    sx={{ flex: 1 }}
                  >
                    Inherit
                  </Button>
                  <Button
                    variant={overrideVal === true ? "contained" : "outlined"}
                    onClick={() => setOverride(selectedUserId, m.key, true)}
                    sx={{ flex: 1 }}
                  >
                    Allow
                  </Button>
                  <Button
                    variant={overrideVal === false ? "contained" : "outlined"}
                    onClick={() => setOverride(selectedUserId, m.key, false)}
                    sx={{ flex: 1 }}
                  >
                    Deny
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
