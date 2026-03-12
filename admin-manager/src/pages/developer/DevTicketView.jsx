import React, { useMemo } from "react";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";

import { clientTickets, aiBlockerTickets } from "../../dev/data/devWorkspaceMock";
import { loadUserTickets } from "../../dev/data/ticketStore";

function calcSubtaskPct(list) {
  const total = list.reduce((s, x) => s + Number(x.points || 0), 0);
  const done = list.filter((x) => x.done).reduce((s, x) => s + Number(x.points || 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export default function DevTicketView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const allTickets = useMemo(() => {
    const user = loadUserTickets();
    return [...user, ...clientTickets, ...aiBlockerTickets];
  }, []);

  const ticket = useMemo(() => allTickets.find((t) => t.id === id) || null, [allTickets, id]);

  if (!ticket) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 950, mb: 1 }}>
          Ticket not found
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/developer")}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const p = calcSubtaskPct(ticket.suggestedSubtasks || []);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Ticket
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 950 }} noWrap>
            {ticket.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: "wrap" }}>
            <Chip size="small" label={ticket.id} variant="outlined" />
            <Chip size="small" label={`Status: ${ticket.status}`} variant="outlined" />
            <Chip size="small" label={`Severity: ${ticket.severity}`} />
          </Stack>
        </Box>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Card>
            <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.2 }}>
              Details
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.88, whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </Typography>

            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.2 }}>
              <Card sx={{ p: 1.8 }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Created via
                </Typography>
                <Typography sx={{ fontWeight: 900 }}>{ticket.createdVia}</Typography>
              </Card>
              <Card sx={{ p: 1.8 }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Created at
                </Typography>
                <Typography sx={{ fontWeight: 900 }}>{ticket.createdAt}</Typography>
              </Card>
              {ticket.client?.name ? (
                <Card sx={{ p: 1.8 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Client
                  </Typography>
                  <Typography sx={{ fontWeight: 900 }}>{ticket.client.name}</Typography>
                </Card>
              ) : null}
              {ticket.detectedFrom?.reason ? (
                <Card sx={{ p: 1.8 }}>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    AI blocker reason
                  </Typography>
                  <Typography sx={{ fontWeight: 900 }}>{ticket.detectedFrom.reason}</Typography>
                </Card>
              ) : null}
            </Box>
          </Card>

          <Card>
            <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.2 }}>
              Evidence / Source
            </Typography>
            {ticket.evidence?.type ? (
              <Card sx={{ p: 1.8 }}>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Source type
                </Typography>
                <Typography sx={{ fontWeight: 900 }}>{ticket.evidence.type}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.86, mt: 1, whiteSpace: "pre-wrap" }}>
                  {ticket.evidence.snippet}
                </Typography>
              </Card>
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                No evidence attached.
              </Typography>
            )}
          </Card>
        </Box>

        <Card>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.2 }}>
            Breakdown (Subtasks)
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Story points
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {p.done}/{p.total} ({p.pct}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={p.pct}
            sx={{ mt: 0.8, height: 7, borderRadius: 999 }}
          />

          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.2 }}>
            {(ticket.suggestedSubtasks || []).map((s) => (
              <Card key={s.id} sx={{ p: 1.8 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                    {s.done ? "✅" : "⬜"} {s.title}
                  </Typography>
                  <Typography sx={{ opacity: 0.8 }}>{s.points} pts</Typography>
                </Box>
              </Card>
            ))}
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.7, mt: 2, display: "block" }}>
            (UI demo) Later you can allow marking subtasks done and update progress.
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
