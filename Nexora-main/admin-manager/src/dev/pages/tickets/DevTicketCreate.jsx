import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";
import { getChatThread } from "../../data/chatStore";
import { createUserTicket } from "../../data/ticketStore";
import { pushNotification } from "../../data/notificationStore";

function buildChatDescription(thread) {
  if (!thread) return "";
  const lines = (thread.messages || []).slice(-12).map((m) => `- ${m.sender}: ${m.text}`);
  return `Issue chat: ${thread.title}\n\nRecent messages:\n${lines.join("\n")}`;
}

export default function DevTicketCreate() {
  const navigate = useNavigate();
  const location = useLocation();

  const chatId = location.state?.chatId || null;
  const thread = useMemo(() => (chatId ? getChatThread(chatId) : null), [chatId]);

  const [title, setTitle] = useState(thread ? thread.title : "");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState(thread ? buildChatDescription(thread) : "");
  const [status, setStatus] = useState("Open");

  const create = () => {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;

    const ticket = createUserTicket({
      title: t,
      severity,
      status,
      createdVia: "CHAT_SUMMARY",
      description: d,
      detectedFrom: thread
        ? { reason: `Created from issue-chat: ${thread.title}`, relatedMessages: [] }
        : null,
      evidence: thread
        ? { type: "ISSUE_CHAT", snippet: `Chat thread ${thread.id}: ${thread.title}` }
        : null,
    });

    pushNotification({ title: "Ticket created", body: `${ticket.id}: ${ticket.title}` });
    navigate(`/dev/tickets/${ticket.id}`);
  };

  return (
    <DevLayout>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Ticket</p>
          <h2 className="text-2xl font-bold">Create Ticket</h2>
          <p className="text-sm text-slate-300 mt-1">
            {thread ? `From chat: ${thread.title}` : "Manual ticket creation"}
          </p>
        </div>
        <Link to="/dev" className="btn-outline">Back</Link>
      </div>

      <div className="glass-card p-5 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-400">Title</label>
            <input
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ticket title"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Severity</label>
            <select
              className="select mt-1"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Status</label>
            <select
              className="select mt-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs text-slate-400">Description</label>
            <textarea
              className="textarea mt-1"
              style={{ minHeight: 200 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
            />
          </div>
        </div>

        <button type="button" onClick={create} className="mt-4 btn-primary">
          Create Ticket
        </button>
      </div>
    </DevLayout>
  );
}
