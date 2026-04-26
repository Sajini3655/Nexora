import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";
import TicketWidget from "../../components/tickets/TicketWidget";
import {
  currentProject,
  clientTickets,
  aiBlockerTickets,
} from "../../data/devWorkspaceMock";
import { loadUserTickets } from "../../data/ticketStore";

export default function DevDashboardHome() {
  const [userTickets, setUserTickets] = useState(() => loadUserTickets());

  useEffect(() => {
    const id = setInterval(() => setUserTickets(loadUserTickets()), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <DevLayout>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Developer Dashboard</h2>
          <p className="text-sm text-slate-300 mt-1">
            Overview of your current project, tickets and AI detected blockers.
          </p>
        </div>
        <span className="chip">SaaS UI Theme</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project widget */}
        <div className="lg:col-span-1">
          <Link to={`/dev/project/${currentProject.id}`} className="block">
            <div className="glass-card p-5 hover:bg-white/10 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Current Project</p>
                  <p className="text-lg font-bold mt-1 truncate">{currentProject.name}</p>
                  <p className="text-sm text-slate-300 mt-1">
                    Code: <span className="font-semibold">{currentProject.code}</span> • Due:{" "}
                    <span className="font-semibold">{currentProject.dueDate}</span>
                  </p>
                </div>

                <div className="text-right min-w-[120px]">
                  <p className="text-xs text-slate-400">Progress</p>
                  <p className="text-xl font-bold">{currentProject.progress}%</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 bg-white/10 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${currentProject.progress}%`,
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Click to open project workspace
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Ticket widgets */}
        <div className="lg:col-span-2 space-y-6">
          <TicketWidget
            title="Client Tickets"
            hint="Created from client email or direct messages"
            tickets={clientTickets}
          />

          <TicketWidget
            title="AI Blocker Tickets"
            hint="Created from chat blocker flows + manual issue chats"
            tickets={[...userTickets, ...aiBlockerTickets]}
          />

          {userTickets.length > 0 && (
            <p className="text-xs text-slate-400">
              Tip: Tickets created from issue chats appear under AI Blocker Tickets.
            </p>
          )}
        </div>
      </div>
    </DevLayout>
  );
}
