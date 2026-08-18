import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Typography,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Collapse
} from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { closeWithBlur } from "../../../utils/focus";
import {
  getAccessModules,
  getAccessRoleMatrix,
  getAccessRoles,
  saveAccessRoleMatrix,
} from "../../../services/api";

const BUILT_IN_ROLES = ["MANAGER", "DEVELOPER", "CLIENT"];
const ROLE_TEMPLATES = ["MANAGER", "DEVELOPER", "CLIENT", "EMPTY"];
const CREATE_ROLE_FEATURES = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "PROJECTS", label: "Projects" },
  { key: "TASKS", label: "Tasks" },
  { key: "TICKETS", label: "Tickets" },
  { key: "TIMESHEETS", label: "Timesheets" },
  { key: "USERS", label: "Users" },
  { key: "CHAT", label: "Chat" },
  { key: "AI_PROJECT_CHAT", label: "AI Project Chat" },
  { key: "AI_SUMMARIZATION", label: "AI Summarization" },
  { key: "AI_TICKET_CREATION", label: "AI Ticket Creation" },
  { key: "AI_DEVELOPER_SUGGESTION", label: "AI Developer Suggestion" },
  { key: "NATURAL_LANGUAGE_NAVIGATION", label: "Natural Language Navigation" },
];

export default function AccessControl() {
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleAccess, setRoleAccess] = useState({});
  const [expandedRole, setExpandedRole] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleTemplate, setNewRoleTemplate] = useState("MANAGER");
  const [previewPermissions, setPreviewPermissions] = useState({});
  const [roleDescriptions, setRoleDescriptions] = useState({});
  const [createError, setCreateError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadAccessData();
  }, []);

  const sortedRoles = useMemo(() => {
    const built = BUILT_IN_ROLES.filter((role) => roles.includes(role));
    const custom = roles.filter((role) => !BUILT_IN_ROLES.includes(role)).sort();
    return [...built, ...custom];
  }, [roles]);

  const loadAccessData = async () => {
    setLoading(true);
    setError("");

    try {
      const [modulesData, rolesData, matrixData] = await Promise.all([
        getAccessModules(),
        getAccessRoles(),
        getAccessRoleMatrix(),
      ]);

      setModules(modulesData ?? []);
      setRoles(rolesData ?? []);
      setRoleAccess(matrixData ?? {});
      setDirty(false);
    } catch (err) {
      setError("Failed to load access control data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role, moduleKey) => {
    setRoleAccess((prev) => ({
      ...prev,
      [role]: { ...(prev?.[role] ?? {}), [moduleKey]: !Boolean(prev?.[role]?.[moduleKey]) },
    }));
    setDirty(true);
  };

  const normalizeRoleAccessPayload = (payload) => {
    const normalized = {};

    Object.entries(payload ?? {}).forEach(([role, entries]) => {
      if (!role || typeof entries !== "object" || entries === null) {
        return;
      }

      const rolePermissions = {};
      Object.entries(entries).forEach(([moduleKey, value]) => {
        if (!moduleKey) {
          return;
        }
        rolePermissions[moduleKey] = Boolean(value);
      });

      normalized[role] = rolePermissions;
    });

    return normalized;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const normalizedPayload = normalizeRoleAccessPayload(roleAccess);
      console.debug("Saving access role matrix payload", normalizedPayload);
      await saveAccessRoleMatrix(JSON.parse(JSON.stringify(normalizedPayload)));
      await loadAccessData();
      setSuccess("Access control changes saved successfully.");
    } catch (err) {
      console.error("Access role matrix save failed", err?.response?.status, err?.details || err?.response?.data || err?.message || err);
      setError("Failed to save access control changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOpen = () => {
    setCreateError("");
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRoleTemplate("MANAGER");
    setPreviewPermissions(buildTemplateDefaults("MANAGER"));
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    closeWithBlur(() => setCreateOpen(false));
  };

  const normalizeRoleName = (value) => {
    return value
      .trim()
      .replace(/[^A-Za-z ]+/g, "")
      .replace(/\s+/g, "_")
      .toUpperCase();
  };

  const isValidRoleName = (value) => {
    return /^[A-Z_]+$/.test(value);
  };

  const buildTemplateDefaults = (template) => {
    const defaults = {};
    modules.forEach((module) => {
      if (template === "MANAGER" || template === "DEVELOPER") {
        defaults[module.key] = true;
      } else if (template === "CLIENT") {
        defaults[module.key] = module.key === "DASHBOARD" || module.key === "CHAT";
      } else {
        defaults[module.key] = false;
      }
    });
    return defaults;
  };

  const handleTemplateChange = (template) => {
    setNewRoleTemplate(template);
    setPreviewPermissions(buildTemplateDefaults(template));
    if (createError) {
      setCreateError("");
    }
  };

  const handlePreviewToggle = (featureKey) => {
    setPreviewPermissions((prev) => ({
      ...prev,
      [featureKey]: !Boolean(prev[featureKey]),
    }));
    setDirty(true);
  };

  const handleCreateRole = () => {
    const name = normalizeRoleName(newRoleName);

    if (!name) {
      setCreateError("Role name is required.");
      return;
    }

    if (!isValidRoleName(name)) {
      setCreateError("Role names may only contain letters and underscores.");
      return;
    }

    if (BUILT_IN_ROLES.includes(name)) {
      setCreateError("That name is reserved for a default role.");
      return;
    }

    if (roles.includes(name)) {
      setCreateError("A role with that name already exists.");
      return;
    }

    const merged = { ...buildTemplateDefaults(newRoleTemplate), ...previewPermissions };
    // Only the selected permissions become the role's assigned set (its rows).
    const rolePermissions = {};
    Object.keys(merged).forEach((key) => {
      if (merged[key]) {
        rolePermissions[key] = true;
      }
    });

    setRoles((prev) => [...prev, name]);
    setRoleAccess((prev) => ({ ...prev, [name]: rolePermissions }));
    setRoleDescriptions((prev) => ({ ...prev, [name]: newRoleDescription.trim() }));
    setExpandedRole(name);
    closeWithBlur(() => setCreateOpen(false));
    setDirty(true);
  };

  const handleDeleteRole = (role) => {
    setRoles((prev) => prev.filter((item) => item !== role));
    setRoleAccess((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
    setRoleDescriptions((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
    setDirty(true);
    if (expandedRole === role) {
      setExpandedRole(sortedRoles.find((item) => item !== role) ?? null);
    }
  };

  if (loading) {
    return <Typography sx={{ opacity: 0.8 }}>Loading access control…</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Access Control"
        subtitle="Manage module permissions, role templates, and custom roles."
        right={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button variant="soft" onClick={handleCreateOpen}>
              <AddCircleOutlineIcon sx={{ mr: 0.5 }} /> Create Role
            </Button>
            <Button variant="outlined" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
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

      <Card sx={{ p: 2.5, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <Box>
            <Typography sx={{ fontWeight: 900 }}>Role-based permissions</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            size="small"
            label={dirty ? "Unsaved changes" : "Saved"}
            color={dirty ? "warning" : "success"}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Card>

      <Grid container spacing={2.5}>
        {sortedRoles.map((role) => (
          <RoleCard
            key={role}
            role={role}
            modules={modules}
            access={roleAccess[role] ?? {}}
            open={expandedRole === role}
            onToggle={toggleRole}
            onExpand={(targetRole) => setExpandedRole((prev) => (prev === targetRole ? null : targetRole))}
            onDelete={handleDeleteRole}
            isBuiltin={BUILT_IN_ROLES.includes(role)}
            description={roleDescriptions[role]}
          />
        ))}
      </Grid>

      <CreateRoleDialog
        open={createOpen}
        name={newRoleName}
        description={newRoleDescription}
        template={newRoleTemplate}
        previewPermissions={previewPermissions}
        error={createError}
        onClose={handleCreateClose}
        onNameChange={(value) => {
          setNewRoleName(value);
          if (createError) {
            setCreateError("");
          }
        }}
        onDescriptionChange={(value) => setNewRoleDescription(value)}
        onTemplateChange={handleTemplateChange}
        onTogglePermission={handlePreviewToggle}
        onCreate={handleCreateRole}
        isCreateDisabled={
          !newRoleName.trim() || roles.includes(normalizeRoleName(newRoleName))
        }
      />
    </Box>
  );
}

function RoleCard({ role, modules, access, open, onToggle, onExpand, onDelete, isBuiltin, description }) {
  // A role's assigned permissions are the modules that have a row for it, i.e. the
  // keys present in `access` (regardless of allowed/denied). Toggling a permission
  // only flips its allowed flag; the key stays, so its row remains listed.
  const visibleModules = modules.filter((module) =>
    Object.prototype.hasOwnProperty.call(access, module.key)
  );
  const activeCount = visibleModules.filter((module) => Boolean(access[module.key])).length;

  return (
    <Grid item xs={12}>
      <Card sx={{ p: 2.5, width: "100%" }}>
        <Box
          onClick={() => onExpand(role)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            flexWrap: "wrap",
            cursor: "pointer",
            userSelect: "none"
          }}
        >
          <Avatar sx={{ bgcolor: "var(--nx-purple)", width: 34, height: 34, fontSize: 14 }}>{role.charAt(0)}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900 }}>{role}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.72 }}>
              {isBuiltin ? "Default role" : description ? description : "Custom role"}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${activeCount}/${visibleModules.length} allowed`}
            sx={{ textTransform: "none" }}
          />

          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onExpand(role);
            }}
            sx={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
            aria-label={open ? "Collapse role" : "Expand role"}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={open} unmountOnExit>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={1}>
            {visibleModules.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ opacity: 0.68, py: 1 }}>
                  No permissions allocated to this role.
                </Typography>
              </Grid>
            ) : (
              visibleModules.map((module) => (
                <Grid item xs={12} key={module.key}>
                  <Card sx={{ p: 2, bgcolor: "var(--nx-panel-2)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>{module.label}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.68 }}>
                          {module.desc}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(access[module.key])}
                            onChange={(event) => {
                              event.stopPropagation();
                              onToggle(role, module.key);
                            }}
                          />
                        }
                        label={access[module.key] ? "Allowed" : "Denied"}
                        sx={{ m: 0 }}
                      />
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
          {!isBuiltin ? (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                tone="danger"
                variant="soft"
                onClick={() => onDelete(role)}
                startIcon={<DeleteOutlineIcon />}
              >
                Delete role
              </Button>
            </Box>
          ) : null}
        </Collapse>
      </Card>
    </Grid>
  );
}

function CreateRoleDialog({
  open,
  name,
  description,
  template,
  previewPermissions,
  error,
  onClose,
  onNameChange,
  onDescriptionChange,
  onTemplateChange,
  onTogglePermission,
  onCreate,
  isCreateDisabled,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          background: "var(--nx-panel)",
          color: "var(--nx-text)",
          border: "1px solid var(--nx-border)",
          borderRadius: 4,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(9, 14, 28, 0.72)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 20 }}>Create Custom Role</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
            Create a new role using a base template and customize its permissions.
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "var(--nx-text)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2, background: "var(--nx-panel)" }}>
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Role name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: "var(--nx-muted)" } }}
                sx={{
                  background: "var(--nx-panel-2)",
                  borderRadius: 2,
                  input: { color: "var(--nx-text)" },
                }}
                helperText="Use letters, numbers, spaces, or underscores."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Role description"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: "var(--nx-muted)" } }}
                sx={{
                  background: "var(--nx-panel-2)",
                  borderRadius: 2,
                  input: { color: "var(--nx-text)" },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Base template"
                value={template}
                onChange={(event) => onTemplateChange(event.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: "var(--nx-muted)" } }}
                sx={{
                  background: "var(--nx-panel-2)",
                  borderRadius: 2,
                  input: { color: "var(--nx-text)" },
                }}
              >
                {ROLE_TEMPLATES.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === "EMPTY" ? "Blank Role" : `${option} template`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ border: "1px solid var(--nx-border)", borderRadius: 3, p: 2, background: "var(--nx-panel-2)" }}>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Permissions preview</Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mb: 2 }}>
              Review the permissions copied from the selected template and adjust them before creating the role.
            </Typography>
            <Grid container spacing={1.5}>
              {CREATE_ROLE_FEATURES.map((feature) => (
                <Grid item xs={12} sm={6} key={feature.key}>
                  <Card sx={{ p: 2, bgcolor: "var(--nx-panel)", border: "1px solid var(--nx-border)", borderRadius: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{feature.label}</Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(previewPermissions[feature.key])}
                            onChange={() => onTogglePermission(feature.key)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: "var(--nx-blue)",
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: "rgba(47, 122, 255, 0.55)",
                              },
                            }}
                          />
                        }
                        label={previewPermissions[feature.key] ? "Enabled" : "Disabled"}
                        sx={{ m: 0, ml: 0 }}
                      />
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, background: "var(--nx-panel)", borderTop: "1px solid var(--nx-border)" }}>
        <Button variant="soft" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onCreate} disabled={isCreateDisabled}>
          Create Role
        </Button>
      </DialogActions>
    </Dialog>
  );
}


