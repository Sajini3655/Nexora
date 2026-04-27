import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CategoryPicker from "../../components/tickets/CategoryPicker";
import {
  clientTicketCategories,
  createClientTicket,
  fetchClientTickets,
} from "../../services/clientService";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";

const emptyForm = {
  category: "",
  title: "",
  project: "",
  urgency: "Medium",
  description: "",
};

export default function ClientTicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);

  const canCreate = useMemo(() => {
    return Boolean(form.category && form.title.trim() && form.description.trim());
  }, [form]);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const rows = await fetchClientTickets();
      setTickets(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.message || "Failed to load client tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const liveTopics = useMemo(() => ["/topic/tickets"], []);
  useLiveRefresh(liveTopics, loadTickets, { debounceMs: 400 });

  const onCreate = async () => {
    if (!canCreate) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const created = await createClientTicket(form);

      setTickets((prev) => [created, ...prev]);
      setForm(emptyForm);
      setSuccess("Ticket created successfully.");
    } catch (err) {
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Tickets
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Create support requests and track their status.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 2 }}>
            Create Ticket
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <CategoryPicker
              value={form.category}
              categories={clientTicketCategories}
              onSelect={(category) => setForm((prev) => ({ ...prev, category }))}
            />

            <TextField
              select
              label="Urgency"
              size="small"
              value={form.urgency}
              onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))}
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
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Project optional"
              size="small"
              value={form.project}
              onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Description"
              size="small"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              minRows={3}
              multiline
              fullWidth
              sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={onCreate}
              disabled={!canCreate || creating}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                bgcolor: "#6d5dfc",
                "&:hover": { bgcolor: "#5b4ee6" },
              }}
            >
              {creating ? "Creating..." : "Create Ticket"}
            </Button>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 2 }}>
            Ticket List
          </Typography>

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 140 }}>
              <CircularProgress sx={{ color: "#6d5dfc" }} />
            </Box>
          ) : tickets.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              No tickets found.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 760 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.8fr",
                    gap: 1.5,
                    pb: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {["Title", "Category", "Status", "Priority", "Updated"].map((h) => (
                    <Typography
                      key={h}
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </Typography>
                  ))}
                </Box>

                {tickets.map((ticket) => (
                  <Box
                    key={ticket.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 0.8fr",
                      gap: 1.5,
                      py: 1.35,
                      alignItems: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                      {ticket.title}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                      {ticket.category || "-"}
                    </Typography>
                    <StatusChip status={ticket.status} />
                    <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
                      {ticket.priority}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                      {ticket.updatedAt}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      </Stack>
    </>
  );
}

function StatusChip({ status }) {
  const color =
    status === "Done"
      ? "rgba(34,197,94,0.15)"
      : status === "In Progress"
        ? "rgba(245,158,11,0.15)"
        : "rgba(124,92,255,0.16)";

  return (
    <StatusBadge label={status} />
  );
}


