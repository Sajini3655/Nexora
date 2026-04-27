import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Grid, MenuItem, TextField, Typography } from "@mui/material";
import Card from "../../../components/ui/Card.jsx";
import { getChatThread } from "../../data/chatStore";
import { createDeveloperTicketOnBackendSafe } from "../../data/ticketApi";
import { pushNotification } from "../../data/notificationStore";

function buildChatDescription(thread) {
  if (!thread) return "";
  const lines = (thread.messages || []).slice(-12).map((m) => `- ${m.sender}: ${m.text}`);
  return `Issue chat: ${thread.title}\n\nRecent messages:\n${lines.join("\n")}`;
}

export default function DevTicketCreate() {
  const navigate = useNavigate();
  const location = useLocation();

  const chatId = location.state?.chatId || null;
  const thread = useMemo(() => (chatId ? getChatThread(chatId) : null), [chatId]);

  const [title, setTitle] = useState(thread ? thread.title : "");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState(thread ? buildChatDescription(thread) : "");
  const [status, setStatus] = useState("Open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    const payload = {
      title: title.trim(),
      description: description.trim(),
      severity,
      status,
    };

    if (!payload.title || !payload.description) {
      setError("Title and description are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const ticket = await createDeveloperTicketOnBackendSafe(payload);
      if (!ticket) {
        throw new Error("The backend ticket API did not return a ticket.");
      }

      pushNotification({ title: "Ticket created", body: `${ticket.id}: ${ticket.title}` });
      navigate(`/dev/tickets/${ticket.id}`);
    } catch (err) {
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)" }}>Ticket</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>Create Ticket</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.72)" }}>
            {thread ? `From chat: ${thread.title}` : "Manual ticket creation backed by the API"}
          </Typography>
        </Box>

        <Button component={Link} to="/dev" variant="outlined" sx={{ borderRadius: 999, textTransform: "none" }}>
          Back
        </Button>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Card sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={8}
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <Button onClick={create} disabled={loading} variant="contained" sx={{ borderRadius: 999, textTransform: "none", px: 3 }}>
                {loading ? "Creating..." : "Create Ticket"}
              </Button>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Tickets are posted directly to the backend API.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </>
  );
}
