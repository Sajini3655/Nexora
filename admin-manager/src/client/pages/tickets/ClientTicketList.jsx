import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import ClientLayout from "../../components/layout/ClientLayout";
import CategoryPicker from "../../components/tickets/CategoryPicker";
import {
  clientTicketCategories,
  createClientTicket,
  fetchClientTickets,
} from "../../services/clientService";

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

  const loadTickets = async () => {
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
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const onCreate = async () => {
    if (!canCreate) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      const created = await createClientTicket(form);
      setTickets((prev) => [created, ...prev]);
      setForm(emptyForm);
      setSuccess("Ticket created and synced.");
    } catch (err) {
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ClientLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.75, letterSpacing: -0.4 }}>
            Client Tickets
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
            Create and track support tickets backed by Supabase.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Box className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
            Create Ticket
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.72)", display: "block", mb: 1 }}>
              Category
            </Typography>
            <CategoryPicker
              value={form.category}
              categories={clientTicketCategories}
              onSelect={(category) => setForm((prev) => ({ ...prev, category }))}
            />
          </Box>

          <Stack spacing={1.5}>
            <TextField
              label="Title"
              size="small"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Project (optional)"
              size="small"
              value={form.project}
              onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}
              fullWidth
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
              label="Description"
              size="small"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              minRows={4}
              multiline
              fullWidth
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={onCreate}
                disabled={!canCreate || creating}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                {creating ? "Creating..." : "Create Ticket"}
              </Button>
            </Box>
          </Stack>
        </Box>

        <Box className="space-y-3">
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Ticket List
          </Typography>

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 120 }}>
              <CircularProgress sx={{ color: "#6b51ff" }} />
            </Box>
          ) : tickets.length === 0 ? (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)" }}>
              No tickets found.
            </Typography>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{ticket.title}</h3>
                    <p className="text-sm text-slate-300">Updated: {ticket.updatedAt}</p>
                    {ticket.category ? (
                      <p className="text-xs text-slate-400 mt-1">Category: {ticket.category}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <span className="block text-xs rounded-full px-3 py-1 bg-white/10 border border-white/20 mb-1">
                      {ticket.status}
                    </span>
                    <span className="text-xs text-slate-300">Priority: {ticket.priority}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Box>
      </Stack>
    </ClientLayout>
  );
}
