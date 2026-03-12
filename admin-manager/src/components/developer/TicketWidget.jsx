import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  MenuItem,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";

function countByStatus(tickets) {
  const res = { Open: 0, "In Progress": 0, Done: 0 };
  for (const t of tickets) {
    if (t.status === "Open") res.Open += 1;
    else if (t.status === "In Progress") res["In Progress"] += 1;
    else res.Done += 1;
  }
  return res;
}

export default function TicketWidget({ title, hint, tickets }) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(() => countByStatus(tickets), [tickets]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return tickets.filter((t) => {
      const statusOk = statusFilter === "All" ? true : t.status === statusFilter;
      const text = `${t.id} ${t.title} ${t.description} ${t.createdVia} ${t.client?.name || ""} ${
        t.detectedFrom?.reason || ""
      }`.toLowerCase();
      const qOk = qLower === "" ? true : text.includes(qLower);
      return statusOk && qOk;
    });
  }, [tickets, statusFilter, q]);

  const visible = showAll ? filtered : filtered.slice(0, 3);

  return (
    <Card>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Tickets
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 950, mt: 0.3 }}>
            {title}
          </Typography>
          {hint ? (
            <Typography variant="body2" sx={{ opacity: 0.72, mt: 0.5 }}>
              {hint}
            </Typography>
          ) : null}
        </Box>

        <Chip size="small" label={`${tickets.length} total`} />
      </Box>

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
        <Chip size="small" label={`Open: ${counts.Open}`} />
        <Chip size="small" label={`In Progress: ${counts["In Progress"]}`} />
        <Chip size="small" label={`Done: ${counts.Done}`} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          {[
            { value: "All", label: "All" },
            { value: "Open", label: "Open" },
            { value: "In Progress", label: "In Progress" },
            { value: "Done", label: "Done" },
          ].map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Input>

        <Input
          label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tickets..."
          sx={{ minWidth: 240, flexGrow: 1 }}
        />
      </Box>

      <List sx={{ mt: 1 }}>
        {visible.map((t) => (
          <ListItemButton
            key={t.id}
            onClick={() => navigate(`/developer/tickets/${t.id}`)}
            sx={{
              borderRadius: 3,
              mb: 1,
              border: "1px solid rgba(255,255,255,0.10)",
              backgroundColor: "rgba(255,255,255,0.03)",
              alignItems: "flex-start",
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontWeight: 900 }}>{t.title}</Typography>
                  <Chip size="small" variant="outlined" label={t.severity} />
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.6 }}>
                  <Typography variant="caption" sx={{ opacity: 0.72, display: "block" }}>
                    {t.id} • {t.status} • {t.createdAt}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.82, mt: 0.6 }}>
                    {t.description}
                  </Typography>
                </Box>
              }
            />
          </ListItemButton>
        ))}
      </List>

      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ opacity: 0.75, mt: 1 }}>
          No tickets found.
        </Typography>
      ) : null}

      {filtered.length > 3 ? (
        <Chip
          sx={{ mt: 2, cursor: "pointer" }}
          label={showAll ? "Show less" : `Show all (${filtered.length})`}
          onClick={() => setShowAll((v) => !v)}
          variant="outlined"
        />
      ) : null}
    </Card>
  );
}
