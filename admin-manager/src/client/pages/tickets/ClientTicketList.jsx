import React, { useEffect, useState } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import { fetchClientTickets } from "../../services/clientService";

export default function ClientTicketList() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchClientTickets().then(setTickets);
  }, []);

  return (
    <ClientLayout>
      <h2 className="text-2xl font-bold mb-4">Client Tickets</h2>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{ticket.title}</h3>
                <p className="text-sm text-slate-300">Updated: {ticket.updatedAt}</p>
              </div>
              <div className="text-right">
                <span className="block text-xs rounded-full px-3 py-1 bg-white/10 border border-white/20 mb-1">
                  {ticket.status}
                </span>
                <span className="text-xs text-slate-300">Priority: {ticket.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ClientLayout>
  );
}
