import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { createDeveloperTicket, formatPriority } from "../../services/developerApi";

export default function DevTicketCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const summary = location.state?.summary || null;

  const initialDescription = useMemo(() => {
    if (!summary) return "";
    const blockers = Array.isArray(summary.blockers) ? summary.blockers : [];
    const lines = [summary.summary || ""];
    if (blockers.length > 0) {
      lines.push("", "Blockers:", ...blockers.map((item) => `- ${item}`));
    }
    return lines.filter(Boolean).join("\n");
  }, [summary]);

  const [title, setTitle] = useState(summary?.ticket_message ? summary.ticket_message : "");
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const ticket = await createDeveloperTicket({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
      });

      setMessage(`Ticket ${ticket.id} created successfully.`);
      navigate(`/dev/tickets/${ticket.id}`);
    } catch (err) {
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
            Create Ticket
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
            Save the blocker to the backend ticket API.
          </Typography>
        </Box>

        <Box component={Link} to="/dev" sx={{ color: "#c4b5fd", fontWeight: 800 }}>
          Back to dashboard
        </Box>
      </Box>

      {summary ? (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          This form was prefilled from the backend chat summary.
        </Alert>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      ) : null}

      {message ? (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
          {message}
        </Alert>
      ) : null}

      <Card sx={{ p: 2.5 }}>
        <Stack spacing={2.2}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={8}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              fullWidth
            >
              {[
                "LOW",
                "MEDIUM",
                "HIGH",
              ].map((item) => (
                <MenuItem key={item} value={item}>
                  {formatPriority(item)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fullWidth
            >
              {[
                "OPEN",
                "IN_PROGRESS",
                "DONE",
              ].map((item) => (
                <MenuItem key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Box
              component="button"
              type="button"
              onClick={handleCreate}
              disabled={loading || !title.trim() || !description.trim()}
              sx={{
                border: 0,
                borderRadius: 2,
                px: 2,
                py: 1.1,
                cursor: loading || !title.trim() || !description.trim() ? "not-allowed" : "pointer",
                fontWeight: 800,
                background: "rgba(124,92,255,0.16)",
                color: "#e7e9ee",
                borderColor: "rgba(124,92,255,0.25)",
                opacity: loading || !title.trim() || !description.trim() ? 0.55 : 1,
              }}
            >
              {loading ? "Creating..." : "Create ticket"}
            </Box>
          </Box>
        </Stack>
      </Card>
    </DevLayout>
  );
}
