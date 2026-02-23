import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";
import { clientTickets, aiBlockerTickets } from "../../data/devWorkspaceMock";
import { loadUserTickets } from "../../data/ticketStore";

function calcSubtaskPct(list) {
  const total = list.reduce((s, x) => s + x.points, 0);
  const done = list.filter((x) => x.done).reduce((s, x) => s + x.points, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

function ProgressBar({ pct }) {
  return (
    <div className="h-2 bg-white/10 rounded-full mt-1">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
        }}
      />
    </div>
  );
}

export default function DevTicketView() {
  const { id } = useParams();

  const allTickets = useMemo(() => {
    const user = loadUserTickets();
    return [...user, ...clientTickets, ...aiBlockerTickets];
  }, []);

  const ticket = useMemo(() => allTickets.find((t) => t.id === id), [allTickets, id]);

  if (!ticket) {
    return (
      <DevLayout>
        <h2 className="text-2xl font-bold mb-4">Ticket not found</h2>
        <Link to="/" className="btn-outline inline-flex">
          Back to Dashboard
        </Link>
      </DevLayout>
    );
  }

  const p = calcSubtaskPct(ticket.suggestedSubtasks || []);

  return (
    <DevLayout>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Ticket</p>
          <h2 className="text-2xl font-bold truncate">{ticket.title}</h2>
          <p className="text-sm text-slate-300 mt-2">
            <span className="chip-muted mr-2">{ticket.id}</span>
            <span className="chip-muted mr-2">Status: {ticket.status}</span>
            <span className="chip-muted">Severity: {ticket.severity}</span>
          </p>
        </div>
        <Link to="/" className="btn-outline">Back</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-2">Details</h3>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{ticket.description}</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Created via</p>
                <p className="font-semibold">{ticket.createdVia}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Created at</p>
                <p className="font-semibold">{ticket.createdAt}</p>
              </div>

              {ticket.client?.name && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Client</p>
                  <p className="font-semibold">{ticket.client.name}</p>
                </div>
              )}

              {ticket.detectedFrom?.reason && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">AI Blocker reason</p>
                  <p className="font-semibold">{ticket.detectedFrom.reason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-2">Evidence / Source</h3>

            {ticket.evidence?.type && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Source type</p>
                <p className="font-semibold">{ticket.evidence.type}</p>
                <p className="text-sm text-slate-200 mt-2 whitespace-pre-wrap">{ticket.evidence.snippet}</p>
              </div>
            )}

            {ticket.detectedFrom?.summaryId && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 mt-3">
                <p className="text-xs text-slate-400">Detected from summary</p>
                <p className="font-semibold">{ticket.detectedFrom.summaryId}</p>
                <p className="text-sm text-slate-200 mt-2">
                  Related messages: {ticket.detectedFrom.relatedMessages?.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-6">
          <div className="glass-card p-4">
            <h3 className="text-lg font-bold mb-2">Breakdown (Subtasks)</h3>

            <div className="text-xs text-slate-400 flex justify-between">
              <span>Story points</span>
              <span>
                {p.done}/{p.total} ({p.pct}%)
              </span>
            </div>

            <ProgressBar pct={p.pct} />

            <div className="mt-4 space-y-2">
              {(ticket.suggestedSubtasks || []).map((s) => (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">
                      {s.done ? "✅" : "⬜"} {s.title}
                    </span>
                    <span className="text-sm">{s.points} pts</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mt-3">
              (UI demo) Later you can allow marking subtasks done and update progress.
            </p>
          </div>
        </div>
      </div>
    </DevLayout>
  );
}
