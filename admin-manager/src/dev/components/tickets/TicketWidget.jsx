import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Box, Chip, Stack, Typography } from "@mui/material";
import Card from "../../../components/ui/Card.jsx";

function Badge({ children }) {
  return (
    <Chip
      label={children}
      size="small"
      sx={{
        height: 26,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.06)",
        color: "rgba(231,233,238,0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 800
      }}
    />
  );
}
Badge.propTypes = { children: PropTypes.node.isRequired };

function SeverityPill({ severity }) {
  const cls =
    severity === "High"
      ? "bg-rose-500/20 border-rose-400/20 text-rose-200"
      : severity === "Medium"
      ? "bg-amber-500/15 border-amber-400/20 text-amber-200"
      : "bg-sky-500/15 border-sky-400/20 text-sky-200";

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{severity}</span>
  );
}
SeverityPill.propTypes = {
  severity: PropTypes.oneOf(["Low", "Medium", "High"]).isRequired,
};

function formatCreatedVia(createdVia) {
  if (createdVia === "BACKEND") return "Backend";
  if (createdVia === "EMAIL") return "Email";
  if (createdVia === "DIRECT_MESSAGE") return "Direct message";
  if (createdVia === "CHAT_SUMMARY") return "Chat summary";
  return createdVia;
}

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
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const counts = useMemo(() => countByStatus(tickets), [tickets]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();

    return tickets.filter((t) => {
      const statusOk = statusFilter === "All" ? true : t.status === statusFilter;

      const text =
        `${t.id} ${t.title} ${t.description} ${t.createdVia} ${t.client?.name || ""} ${
          t.detectedFrom?.reason || ""
        }`.toLowerCase();

      const qOk = qLower === "" ? true : text.includes(qLower);

      return statusOk && qOk;
    });
  }, [tickets, statusFilter, q]);

  const visible = showAll ? filtered : filtered.slice(0, 3);

  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Tickets
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1, letterSpacing: -0.3 }}>
            {title}
          </Typography>
          {hint ? (
            <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.68)" }}>
              {hint}
            </Typography>
          ) : null}
        </Box>

        <Badge>{tickets.length} total</Badge>
      </Box>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
        <Badge>Open: {counts.Open}</Badge>
        <Badge>In Progress: {counts["In Progress"]}</Badge>
        <Badge>Done: {counts.Done}</Badge>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, mt: 2 }}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {["All", "Open", "In Progress", "Done"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                statusFilter === s
                  ? "btn-primary px-4 py-2 text-xs rounded-full"
                  : "btn-outline px-4 py-2 text-xs rounded-full"
              }
              type="button"
            >
              {s}
            </button>
          ))}
        </Stack>

        <input
          className="md:ml-auto input md:w-72"
          placeholder="Search tickets..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Box>

      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {visible.map((t) => (
          <Link
            key={t.id}
            to={`/dev/tickets/${t.id}`}
            className="block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4"
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800 }} noWrap>
                  {t.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", mt: 0.5, display: "block" }}>
                  {t.id} • {t.status} • {t.createdAt}
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.86)", mt: 1.25 }}>
                  {t.description}
                </Typography>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                  <Badge>Created via: {formatCreatedVia(t.createdVia)}</Badge>
                  {t.client?.name ? <Badge>Client: {t.client.name}</Badge> : null}
                  {t.detectedFrom?.reason ? <Badge>AI Blocker</Badge> : null}
                </Stack>
              </Box>

              <Box sx={{ shrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <SeverityPill severity={t.severity} />
                <Chip size="small" label="View" sx={{ bgcolor: "rgba(124,92,255,0.16)", border: "1px solid rgba(124,92,255,0.25)", color: "#e7e9ee", fontWeight: 900 }} />
              </Box>
            </Box>
          </Link>
        ))}

        {filtered.length === 0 && (
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
            No tickets found.
          </Typography>
        )}
      </Box>

      {filtered.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 w-full btn-outline"
        >
          {showAll ? "Show less" : `Show all (${filtered.length})`}
        </button>
      )}
    </Card>
  );
}

TicketWidget.propTypes = {
  title: PropTypes.string.isRequired,
  hint: PropTypes.string,
  tickets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.oneOf(["Open", "In Progress", "Done"]).isRequired,
      severity: PropTypes.oneOf(["Low", "Medium", "High"]).isRequired,
      createdAt: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      client: PropTypes.shape({ name: PropTypes.string }),
      detectedFrom: PropTypes.shape({ reason: PropTypes.string }),
      createdVia: PropTypes.oneOf(["EMAIL", "DIRECT_MESSAGE", "CHAT_SUMMARY", "BACKEND"]).isRequired,
    })
  ).isRequired,
};

TicketWidget.defaultProps = {
  hint: "",
};

