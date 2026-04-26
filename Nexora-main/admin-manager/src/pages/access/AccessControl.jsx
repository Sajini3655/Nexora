import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Divider
} from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getRoles, createRole, createRoleWithUser, updateRolePermissions, deleteRole } from "../../services/api";

const MODULES = [
  { key: "DASHBOARD", label: "Dashboard", desc: "Basic overview access" },
  { key: "TASKS", label: "Tasks", desc: "Task workflows and boards" },
  { key: "CHAT", label: "Chat", desc: "Messaging and announcements" },
  { key: "FILES", label: "Files", desc: "Uploads and downloads" },
  { key: "REPORTS", label: "Reports", desc: "Exports and analytics" }
];

function Pill({ label, color = "primary" }) {
  const isSystem = label === "SYSTEM";
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        fontSize: '10px',
        height: '20px',
        background: isSystem ? "rgba(255, 107, 107, 0.16)" : "rgba(124,92,255,0.16)",
        border: isSystem ? "1px solid rgba(255, 107, 107, 0.25)" : "1px solid rgba(124,92,255,0.25)",
        color: isSystem ? "#ff6b6b" : "#7c5cff",
        fontWeight: 700
      }}
    />
  );
}

function isValidEmail(value) {
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AccessControl() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New Role Dialog state
  const [open, setOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [assignUser, setAssignUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const canCreateRole = newRoleName.trim().length > 0 && (
    !assignUser || (
      newUserName.trim().length >= 2 &&
      isValidEmail(newUserEmail) &&
      newUserPassword.trim().length >= 6
    )
  );

  const resetCreateRoleForm = () => {
    setNewRoleName("");
    setAssignUser(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
  };

  // Delete Confirmation state
  const [deleteId, setDeleteId] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await getRoles();
      setRoles(res.data);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setError("Failed to load roles from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async () => {
    const roleName = newRoleName.trim();
    if (!roleName) return;

    if (assignUser) {
      if (newUserName.trim().length < 2) {
        setSnackbar({ open: true, message: "User name must be at least 2 characters.", severity: "error" });
        return;
      }
      if (!isValidEmail(newUserEmail)) {
        setSnackbar({ open: true, message: "Enter a valid email address for the user.", severity: "error" });
        return;
      }
      if (newUserPassword.trim().length < 6) {
        setSnackbar({ open: true, message: "Password must be at least 6 characters long.", severity: "error" });
        return;
      }
    }

    try {
      setCreating(true);

      if (assignUser) {
        await createRoleWithUser({
          roleName: roleName.toUpperCase(),
          userName: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword.trim(),
        });
      } else {
        await createRole(roleName.toUpperCase());
      }

      setNewRoleName("");
      setAssignUser(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setOpen(false);
      fetchRoles();
      setSnackbar({ open: true, message: assignUser ? "Role and user created successfully" : "Role created successfully", severity: "success" });
    } catch (err) {
      console.error("Failed to create role:", err);
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || err?.message || "Failed to create role",
        severity: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteId) return;
    try {
      setLoading(true);
      await deleteRole(deleteId);
      setDeleteId(null);
      fetchRoles();
      setSnackbar({ open: true, message: "Role deleted successfully", severity: "success" });
    } catch (err) {
      console.error("Failed to delete role:", err);
      setSnackbar({ open: true, message: "Failed to delete role", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (roleId, moduleKey) => {
    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          permissions: role.permissions.map(p => {
            if (p.moduleKey === moduleKey) {
              return { ...p, canAccess: !p.canAccess };
            }
            return p;
          })
        };
      }
      return role;
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const savePromises = roles.map(role => 
        updateRolePermissions(role.id, role.permissions)
      );
      await Promise.all(savePromises);
      setSnackbar({ open: true, message: "All permissions saved successfully", severity: "success" });
    } catch (err) {
      console.error("Failed to save permissions:", err);
      setSnackbar({ open: true, message: "Failed to save permissions", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && roles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Access Control"
        subtitle="Define module access by role and create custom organization roles."
        right={
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              Create New Role
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ p: 2.5 }}>
        <RoleMatrix
          roles={roles}
          onToggleRole={togglePermission}
          onDeleteRole={setDeleteId}
        />
      </Card>

      {/* Create Role Dialog */}
      <Dialog 
        open={open} 
        onClose={() => {
          if (!creating) {
            setOpen(false);
            resetCreateRoleForm();
          }
        }}
        PaperProps={{
          sx: {
            background: "#0f172a",
            backgroundImage: "radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.15) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.1) 0, transparent 50%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            padding: 1,
            color: "#fff"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: "1.5rem", pb: 1 }}>Create New Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.7, color: "slate.300" }}>
            Enter a unique name for the new role (e.g., HR, Auditor, Supervisor).
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            disabled={creating}
            placeholder="e.g. HR_MANAGER"
            InputProps={{
              sx: {
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.03)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2) !important" },
                color: "#fff"
              }
            }}
            InputLabelProps={{
              sx: { color: "rgba(255,255,255,0.5)" }
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={assignUser}
                onChange={(e) => setAssignUser(e.target.checked)}
                disabled={creating}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7c5cff' } }}
              />
            }
            label="Create login for this role"
            sx={{ mt: 2, color: 'rgba(255,255,255,0.8)' }}
          />

          {assignUser && (
            <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
              <TextField
                margin="dense"
                label="User Full Name"
                fullWidth
                variant="outlined"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                disabled={creating}
                InputProps={{
                  sx: {
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.03)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2) !important" },
                    color: "#fff"
                  }
                }}
                InputLabelProps={{
                  sx: { color: "rgba(255,255,255,0.5)" }
                }}
              />
              <TextField
                margin="dense"
                label="User Email"
                fullWidth
                variant="outlined"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={creating}
                InputProps={{
                  sx: {
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.03)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2) !important" },
                    color: "#fff"
                  }
                }}
                InputLabelProps={{
                  sx: { color: "rgba(255,255,255,0.5)" }
                }}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                disabled={creating}
                helperText="Minimum 6 characters"
                InputProps={{
                  sx: {
                    borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.03)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2) !important" },
                    color: "#fff"
                  }
                }}
                InputLabelProps={{
                  sx: { color: "rgba(255,255,255,0.5)" }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => {
              if (!creating) {
                setOpen(false);
                resetCreateRoleForm();
              }
            }} 
            disabled={creating}
            sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { bgcolor: "rgba(255,255,255,0.05)" } }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateRole} 
            disabled={creating || !canCreateRole}
            sx={{ 
              borderRadius: "12px",
              px: 4,
              py: 1,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(135deg, #7c5cff 0%, #6366f1 100%)",
              boxShadow: "0 10px 20px -5px rgba(124, 92, 255, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #6d4aff 0%, #4f46e5 100%)",
              }
            }}
          >
            {creating ? "Creating..." : "Create Role"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        open={Boolean(deleteId)} 
        onClose={() => setDeleteId(null)}
        PaperProps={{
          sx: {
            background: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            padding: 1,
            color: "#fff"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: "1.25rem" }}>Delete Role?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Are you sure you want to delete this role? This action cannot be undone and users assigned to this role may lose access.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteId(null)}
            sx={{ color: "rgba(255,255,255,0.6)" }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteRole}
            sx={{ 
              borderRadius: "12px",
              px: 3,
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.3)"
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function RoleMatrix({ roles, onToggleRole, onDeleteRole }) {
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <SecurityIcon color="primary" />
        <Typography sx={{ fontWeight: 900 }}>Role & Permissions Matrix</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Pill label="Enterprise Controls" />
      </Stack>

      <Typography variant="body2" sx={{ opacity: 0.7, mb: 3 }}>
        Toggle permissions for each role across the system modules.
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {roles.map(r => (
          <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5, px: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>{r.name}</Typography>
            {r.systemRole && <Pill label="SYSTEM" />}
            {!r.systemRole && (
              <IconButton size="small" onClick={() => onDeleteRole(r.id)} sx={{ p: 0.2 }}>
                <DeleteIcon sx={{ fontSize: 14 }} color="error" />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      <Grid container spacing={3}>
        {MODULES.map((m) => (
          <Grid item xs={12} key={m.key}>
            <Card sx={{ 
              p: 2.25, 
              borderLeft: "4px solid #7C5CFF",
              background: "rgba(255,255,255,0.02)" 
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Box sx={{ flex: "0 0 200px" }}>
                  <Typography sx={{ fontWeight: 900 }}>{m.label}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
                    {m.desc}
                  </Typography>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flex: 1 }}>
                  {roles.map((role) => {
                    const permission = role.permissions.find(p => p.moduleKey === m.key);
                    const isChecked = permission ? permission.canAccess : false;
                    
                    return (
                      <Box
                        key={role.id}
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: '16px',
                          bgcolor: isChecked ? 'rgba(124, 92, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                          border: isChecked ? '1px solid rgba(124, 92, 255, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                          minWidth: '140px',
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            background: isChecked ? 'rgba(124, 92, 255, 0.12)' : 'rgba(255,255,255,0.05)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={() => onToggleRole(role.id, m.key)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#7c5cff' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#7c5cff' }
                          }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.8rem', lineHeight: 1 }}>
                            {role.name}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>
                            {isChecked ? "Allowed" : "Denied"}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

