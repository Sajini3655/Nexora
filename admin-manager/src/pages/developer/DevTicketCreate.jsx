import React, { useMemo, useState } from "react";
import { Box, MenuItem, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";

import { getChatThread } from "../../dev/data/chatStore";
import { createUserTicket } from "../../dev/data/ticketStore";
import { pushNotification } from "../../dev/data/notificationStore";

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
    navigate(`/developer/tickets/${ticket.id}`);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Ticket
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Create Ticket
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.6 }}>
            {thread ? `From chat: ${thread.title}` : "Manual ticket creation"}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Card>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 1.5 }}>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ticket title"
          />

          <Input select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Input>

          <Input select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ gridColumn: { xs: "1", md: "span 2" } }}>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Done">Done</MenuItem>
          </Input>

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            multiline
            minRows={8}
            sx={{ gridColumn: { xs: "1", md: "span 2" } }}
          />
        </Box>

        <Button sx={{ mt: 2 }} onClick={create}>
          Create Ticket
        </Button>
      </Card>
    </Box>
  );
}
