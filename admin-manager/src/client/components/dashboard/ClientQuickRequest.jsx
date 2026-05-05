import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CategoryPicker from "../tickets/CategoryPicker";
import {
  clientTicketCategories,
  createClientTicket,
} from "../../services/clientService";

const emptyForm = {
  category: "",
  title: "",
  projectId: "",
  urgency: "Medium",
  description: "",
};

export default function ClientQuickRequest({ projects = [], onTicketCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreate = useMemo(() => {
    return Boolean(projects.length > 0 && form.projectId && form.category && form.title.trim() && form.description.trim());
  }, [form, projects.length]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const createdTicket = await createClientTicket(form);

      setForm(emptyForm);
      setSuccess("Request submitted successfully.");

      if (onTicketCreated) {
        onTicketCreated(createdTicket);
      }
    } catch (err) {
      setError(err?.message || "Failed to submit request.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 2.2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
            Quick Request
          </Typography>

          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.4 }}>
            Send a bug report, change request, or feedback without leaving the dashboard.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <TextField
            select
            label="Project"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={form.projectId}
            onChange={(e) => updateField("projectId", e.target.value)}
            SelectProps={{ native: true }}
            fullWidth
            disabled={projects.length === 0}
            helperText={projects.length === 0 ? "No projects assigned to your account yet." : "Select the project this request belongs to."}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </TextField>

          <CategoryPicker
            value={form.category}
            categories={clientTicketCategories}
            onSelect={(category) => updateField("category", category)}
          />

          <TextField
            select
            label="Urgency"
            size="small"
            value={form.urgency}
            onChange={(e) => updateField("urgency", e.target.value)}
            SelectProps={{ native: true }}
            fullWidth
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </TextField>

          <TextField
            label="Title"
            size="small"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            fullWidth
          />

          <TextField
            label="Message"
            size="small"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            minRows={3}
            multiline
            fullWidth
            sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!canCreate || creating}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              bgcolor: "#6d5dfc",
              "&:hover": { bgcolor: "#5b4ee6" },
            }}
          >
            {creating ? "Submitting..." : "Submit Request"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
