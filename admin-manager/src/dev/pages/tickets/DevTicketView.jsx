import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import Card from "../../../components/ui/Card.jsx";
import { loadUserTickets } from "../../data/ticketStore";
import { loadDeveloperTicketByIdFromBackendSafe } from "../../data/ticketApi";
import { useDeveloperTicket } from "../../data/useDeveloperTickets";

function calcSubtaskPct(list) {
  const total = list.reduce((s, x) => s + Number(x.points || 0), 0);
  const done = list.filter((x) => x.done).reduce((s, x) => s + Number(x.points || 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

function ProgressBar({ pct }) {
  return (
    <Box sx={{ height: 8, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 999, mt: 1 }}>
      <Box sx={{ height: 8, borderRadius: 999, width: `${pct}%`, background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))" }} />
    </Box>
  );
}

export default function DevTicketView() {
  const { id } = useParams();

  // React Query hook
  const { data: ticket, isLoading: loading, error: queryError } = useDeveloperTicket(id, !!id);
  const error = queryError?.message || "";

  const p = useMemo(() => calcSubtaskPct(ticket?.suggestedSubtasks || []), [ticket]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "#6b51ff" }} />
      </Box>
    );
  }

  if (!ticket) {
    return (
      <>
        {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Ticket not found</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(231,233,238,0.72)" }}>
            No backend or local ticket matched <strong>{id}</strong>.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip component={Link} clickable to="/dev" label="Back to dashboard" />
          </Box>
        </Card>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)" }}>Ticket</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>{ticket.title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.72)" }}>
            <Chip label={ticket.id} size="small" sx={{ mr: 1 }} />
            <Chip label={ticket.status} size="small" sx={{ mr: 1 }} />
            <Chip label={ticket.severity} size="small" />
          </Typography>
        </Box>

        <Chip component={Link} clickable to="/dev" label="Back" />
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Details</Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.84)", whiteSpace: "pre-wrap" }}>{ticket.description}</Typography>

            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
              <Metric label="Created via" value={ticket.createdVia} />
              <Metric label="Created at" value={ticket.createdAt} />
              {ticket.client?.name ? <Metric label="Client" value={ticket.client.name} /> : null}
              {ticket.detectedFrom?.reason ? <Metric label="Source reason" value={ticket.detectedFrom.reason} /> : null}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Breakdown</Typography>
            <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
              Story points {p.done}/{p.total} ({p.pct}%)
            </Typography>
            <ProgressBar pct={p.pct} />

            <Box sx={{ mt: 2, display: "grid", gap: 1.25 }}>
              {(ticket.suggestedSubtasks || []).map((subtask) => (
                <Box key={subtask.id} sx={{ p: 1.5, borderRadius: 2, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {subtask.done ? "✓" : "•"} {subtask.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{subtask.points} pts</Typography>
                </Box>
              ))}

              {(!ticket.suggestedSubtasks || ticket.suggestedSubtasks.length === 0) ? (
                <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>No subtasks available.</Typography>
              ) : null}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}
