import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function Badge({ children }) {
  return <span className="chip">{children}</span>;
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
    <div className="glass-card p-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">Tickets</p>
          <h3 className="text-lg font-bold">{title}</h3>
          {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
        </div>

        <Badge>{tickets.length} total</Badge>
      </div>

      {/* status summary */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Badge>Open: {counts.Open}</Badge>
        <Badge>In Progress: {counts["In Progress"]}</Badge>
        <Badge>Done: {counts.Done}</Badge>
      </div>

      {/* filters */}
      <div className="flex flex-col md:flex-row gap-2 mt-4">
        <div className="flex gap-2 flex-wrap">
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
        </div>

        <input
          className="md:ml-auto input md:w-72"
          placeholder="Search tickets..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* list */}
      <div className="mt-4 space-y-3">
        {visible.map((t) => (
          <Link
            key={t.id}
            to={`/tickets/${t.id}`}
            className="block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{t.title}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {t.id} • {t.status} • {t.createdAt}
                </p>

                <p className="text-sm text-slate-200 mt-2">{t.description}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge>Created via: {t.createdVia}</Badge>
                  {t.client?.name && <Badge>Client: {t.client.name}</Badge>}
                  {t.detectedFrom?.reason && <Badge>AI Blocker</Badge>}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <SeverityPill severity={t.severity} />
                <span className="chip-muted">View</span>
              </div>
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-slate-300">No tickets found.</p>
        )}
      </div>

      {/* show more */}
      {filtered.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 w-full btn-outline"
        >
          {showAll ? "Show less" : `Show all (${filtered.length})`}
        </button>
      )}
    </div>
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
      createdVia: PropTypes.oneOf(["EMAIL", "DIRECT_MESSAGE", "CHAT_SUMMARY"]).isRequired,
      createdAt: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      client: PropTypes.shape({ name: PropTypes.string }),
      detectedFrom: PropTypes.shape({ reason: PropTypes.string }),
    })
  ).isRequired,
};

TicketWidget.defaultProps = {
  hint: "",
};
