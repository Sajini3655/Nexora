import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import {
  getAccessModules,
  getAccessRoleMatrix,
  getAccessRoles,
  getAccessUserOverrides,
  getAccessUsers,
  saveAccessRoleMatrix,
  saveAccessUserOverrides,
} from "../../services/api";

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
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [roleAccess, setRoleAccess] = useState({});

  // User Overrides state (null=inherit, true=allow, false=deny)
  const [selectedUserId, setSelectedUserId] = useState(null);
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    loadAccessData();
  }, []);

  useEffect(() => {
    if (!selectedUserId || modules.length === 0) return;
    loadUserOverrides(selectedUserId);
  }, [selectedUserId, modules]);

  const loadAccessData = async () => {
    setLoading(true);
    setError("");

    try {
      const [modulesData, rolesData, matrixData, usersData] = await Promise.all([
        getAccessModules(),
        getAccessRoles(),
        getAccessRoleMatrix(),
        getAccessUsers(),
      ]);

      setModules(modulesData ?? []);
      setRoles(rolesData ?? []);
      setRoleAccess(matrixData ?? {});
      setUsers(usersData ?? []);

      if (usersData?.length) {
        setSelectedUserId((prev) => prev ?? usersData[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load access control data.");
    } finally {
      setLoading(false);
    }
  };

  const loadUserOverrides = async (userId) => {
    try {
      const raw = await getAccessUserOverrides(userId);
      const shaped = {};
      for (const m of modules) {
        shaped[m.key] = Object.prototype.hasOwnProperty.call(raw || {}, m.key)
          ? raw[m.key]
          : null;
      }
      setOverrides(shaped);
    } catch (err) {
      console.error(err);
      setError("Failed to load user overrides.");
    }
  };

  const toggleRole = (role, moduleKey) => {
    setRoleAccess((prev) => ({
      ...prev,
      [role]: { ...prev[role], [moduleKey]: !prev[role][moduleKey] }
    }));
  };

  const setOverride = (userId, moduleKey, value) => {
    setOverrides((prev) => ({ ...prev, [moduleKey]: value }));
  };

  const effectiveAccess = (user, moduleKey) => {
    const o = overrides[moduleKey];
    if (o === true || o === false) return o;
    return Boolean(roleAccess[user.role]?.[moduleKey]);
  };

  const summary = useMemo(() => {
    // quick premium summary for selected user
    if (!selectedUser) return { allowed: 0, denied: 0 };
    let allowed = 0;
    let denied = 0;
    for (const m of modules) {
      effectiveAccess(selectedUser, m.key) ? allowed++ : denied++;
    }
    return { allowed, denied };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, roleAccess, overrides, modules, users]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await saveAccessRoleMatrix(roleAccess);

      if (selectedUserId) {
        const saved = await saveAccessUserOverrides({
          userId: selectedUserId,
          overrides,
        });

        const shaped = {};
        for (const m of modules) {
          shaped[m.key] = Object.prototype.hasOwnProperty.call(saved || {}, m.key)
            ? saved[m.key]
            : null;
        }
        setOverrides(shaped);
      }

      setSuccess("Access control changes saved.");
    } catch (err) {
      console.error(err);
      setError("Failed to save access control changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography sx={{ opacity: 0.8 }}>Loading access control...</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Access Control"
        subtitle="Define module access by role, and override per user (especially for clients)."
        right={
          <Button variant="outlined" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}

      <Card sx={{ p: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Role Matrix" />
          <Tab label="User Overrides" />
        </Tabs>

        <Divider sx={{ mb: 2 }} />

        {tab === 0 ? (
          <RoleMatrix
            modules={modules}
            roles={roles}
            roleAccess={roleAccess}
            onToggleRole={toggleRole}
          />
        ) : (
          <UserOverrides
            users={users}
            modules={modules}
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

function RoleMatrix({ modules, roles, roleAccess, onToggleRole }) {
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
        {modules.map((m) => (
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
                  {roles.map((r) => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Switch
                          checked={Boolean(roleAccess?.[r]?.[m.key])}
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
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  const effectiveAccess = (user, moduleKey) => {
    const o = overrides[moduleKey];
    if (o === true || o === false) return o;
    return Boolean(roleAccess[user.role]?.[moduleKey]);
  };

  if (!selectedUser) {
    return <Typography sx={{ opacity: 0.8 }}>No users available for overrides.</Typography>;
  }

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
          value={selectedUserId ?? ""}
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
          const overrideVal = overrides[m.key]; // null/true/false
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
