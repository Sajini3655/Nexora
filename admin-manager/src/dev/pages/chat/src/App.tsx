import React, { useState, useRef } from "react";
import { Box, Button, TextField, Typography, Paper, Dialog, DialogTitle, DialogActions } from "@mui/material";

interface Message {
  user: string;
  ai: string;
}

const App: React.FC = () => {
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [ticketsCreated, setTicketsCreated] = useState<any[]>([]); 
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [pendingEndData, setPendingEndData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startChat = async () => {
    try {
      await fetch("http://127.0.0.1:8000/chat/start", { method: "POST" });
      setChatStarted(true);
      setMessages([]);
      setSummary(null);
      setBlockers([]);
      setTicketsCreated([]);
    } catch (err) {
      console.error("Start chat error:", err);
    }
  };

  const endChat = async (createTickets?: boolean) => {
    try {
      const res = await fetch("http://127.0.0.1:8000/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: "123",
          messages: messages.map((m) => ({
            user: m.user,
            message: m.user + " " + m.ai,
          })),
          create_tickets: createTickets,
        }),
      });

      const data = await res.json();

      if (data.ticket_prompt_needed && createTickets === undefined) {
        setPendingEndData(data);
        setShowTicketDialog(true);
      } else {
        setSummary(data.summary);
        setBlockers(data.blockers);
        setTicketsCreated(data.tickets_created || []); 
        setChatStarted(false);
        setPendingEndData(null);
      }
    } catch (err) {
      console.error("End chat error:", err);
    }
  };

  const handleTicketDecision = async (create: boolean) => {
    setShowTicketDialog(false);
    if (pendingEndData) {
      await endChat(create);
    } else {
      setChatStarted(false);
    }
  };

  const sendMessage = async () => {
    if (!input) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { user: userMessage, ai: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiText += chunk;

        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, ai: aiText } : m
          )
        );

        scrollToBottom();
      }
    } catch (err) {
      console.error("Send message error:", err);
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        width: 600,
        margin: "50px auto",
        padding: 3,
        borderRadius: 4,
        bgcolor: "#0b1a2b",
        color: "#ffffff",
        boxShadow: "0 4px 30px rgba(0,0,0,0.7)",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 700,
          color: "#00bfff",
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        NEXORA Chat
      </Typography>

      {!chatStarted ? (
        <Button
          variant="contained"
          sx={{ backgroundColor: "#00bfff", color: "#0b1a2b", width: "100%" }}
          onClick={startChat}
        >
          Start Chat
        </Button>
      ) : (
        <>
          <Paper
            sx={{
              height: 450,
              overflowY: "auto",
              p: 2,
              mb: 2,
              bgcolor: "#0f223e",
              borderRadius: 3,
            }}
          >
            {messages.map((m, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    bgcolor: "#1f2f4f",
                    color: "#00d1ff",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    mb: 1,
                    maxWidth: "80%",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    You:
                  </Typography>
                  <Typography>{m.user}</Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: "#22334f",
                    color: "#90ee90",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    maxWidth: "80%",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    AI:
                  </Typography>
                  <Typography>{m.ai}</Typography>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Paper>

          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              variant="outlined"
              size="medium"
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              sx={{
                bgcolor: "#0b1a2b",
                input: { color: "#ffffff" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#00bfff",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#00d1ff",
                },
              }}
            />
            <Button
              variant="contained"
              sx={{ backgroundColor: "#00bfff", color: "#0b1a2b" }}
              onClick={sendMessage}
              disabled={loading}
            >
              Send
            </Button>
          </Box>

          <Button
            variant="outlined"
            sx={{
              mt: 2,
              width: "100%",
              color: "#ff6b81",
              borderColor: "#ff6b81",
              "&:hover": { borderColor: "#ff6b81" },
            }}
            onClick={() => endChat()}
          >
            End Chat
          </Button>
        </>
      )}

      {summary && (
        <Paper
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: "#112233",
            color: "#ffffff",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1, color: "#00bfff" }}>
            Chat Summary
          </Typography>
          <Typography sx={{ mb: 1 }}>{summary}</Typography>

          {blockers.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 1, color: "#ff6b81" }}>
                Blockers Detected
              </Typography>
              {blockers.map((b, i) => (
                <Typography key={i} sx={{ ml: 1 }}>
                  - {b}
                </Typography>
              ))}
            </>
          )}

          {ticketsCreated.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 2, color: "#00ff99" }}>
                Tickets Created
              </Typography>
              {ticketsCreated.map((t) => (
                <Typography key={t.ticket_id} sx={{ ml: 1 }}>
                  - {t.ticket_id}: {t.blocker}
                </Typography>
              ))}
            </>
          )}
        </Paper>
      )}

      <Dialog open={showTicketDialog} onClose={() => handleTicketDecision(false)}>
        <DialogTitle>Create tickets for detected blockers?</DialogTitle>
        <DialogActions>
          <Button onClick={() => handleTicketDecision(false)}>No</Button>
          <Button onClick={() => handleTicketDecision(true)} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
