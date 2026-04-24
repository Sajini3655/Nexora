import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { fetchDeveloperTicketById, fetchDeveloperTickets } from "../../services/developerApi";

export default function DevTicketView() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [ticketData, ticketsData] = await Promise.all([
          fetchDeveloperTicketById(id),
          fetchDeveloperTickets(),
        ]);

        if (!active) return;

        setTicket(ticketData);
        setRelated(Array.isArray(ticketsData) ? ticketsData : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load ticket details.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const otherTickets = useMemo(() => related.filter((item) => String(item.id) !== String(id)).slice(0, 4), [id, related]);

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading ticket...</Typography>
          </Stack>
        </Box>
      </DevLayout>
    );
  }

  if (error) {
    return (
      <DevLayout>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </DevLayout>
    );
  }

  if (!ticket) {
    return (
      <DevLayout>
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          Ticket not found.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Link to="/dev" style={{ color: "#c4b5fd", fontWeight: 700 }}>
            Back to dashboard
          </Link>
        </Box>
      </DevLayout>
    );
  }

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
            Ticket details
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }} noWrap>
            {ticket.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
            {ticket.id} • {ticket.status} • {ticket.priority}
          </Typography>
        </Box>

        <Box component={Link} to="/dev" sx={{ color: "#c4b5fd", fontWeight: 800 }}>
          Back to dashboard
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.8fr" }, gap: 3 }}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Description
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5, color: "rgba(231,233,238,0.88)", whiteSpace: "pre-wrap" }}>
            {ticket.description || "No description provided."}
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Metadata
          </Typography>

          <Stack spacing={1.4} sx={{ mt: 1.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Created by
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{ticket.createdByName}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Assigned to
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{ticket.assignedToName || "-"}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Created at
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{ticket.createdAt}</Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Updated at
              </Typography>
              <Typography sx={{ fontWeight: 800 }}>{ticket.updatedAt}</Typography>
            </Box>
          </Stack>
        </Card>
      </Box>

      {otherTickets.length > 0 ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: -0.3 }}>
            Other visible tickets
          </Typography>
          <Stack spacing={1.2}>
            {otherTickets.map((item) => (
              <Card key={item.id} sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.62)" }}>
                      {item.id} • {item.status} • {item.priority}
                    </Typography>
                  </Box>
                  <Link to={`/dev/tickets/${item.id}`} style={{ color: "#c4b5fd", fontWeight: 700 }}>
                    Open
                  </Link>
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
      ) : null}
    </DevLayout>
  );
}
