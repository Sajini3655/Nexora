import React, { useState, useRef, useEffect, CSSProperties } from "react";
import { sendMessage, endChat } from "./api";
import { Button, IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface Message {
  user: "user" | "assistant";
  message: string;
}

interface ChatBoxProps {
  projectId: string;
  onSummary: (data: any) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ projectId, onSummary }) => {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<Message[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [showTicketBubble, setShowTicketBubble] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatWindowRef.current?.scrollTo({
      top: chatWindowRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, aiTyping, summaryData, showTicketBubble]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { user: "user", message: input };
    setChat((c) => [...c, userMsg]);
    setInput("");
    setAiTyping(true);

    let aiText = "";
    try {
      await sendMessage([...chat, userMsg], projectId, (chunk) => {
        aiText += chunk;
        setChat((prev) => {
          const last = prev[prev.length - 1];
          if (last?.user === "assistant") {
            return [...prev.slice(0, -1), { user: "assistant", message: aiText }];
          }
          return [...prev, { user: "assistant", message: aiText }];
        });
      });
    } catch {
      setChat((prev) => [...prev, { user: "assistant", message: "[Error sending message]" }]);
    }

    setAiTyping(false);
  };

  <Button color="secondary" variant="outlined" onClick={() => handleEndChat()}>
  End Chat
</Button>

// inside handleEndChat:
const handleEndChat = async () => {
  try {
    const result = await endChat(chat, projectId);  // projectId = your task ID here
    setSummaryData(result);
    if (result.blockers?.length > 0 && result.ticket_prompt_needed) setShowTicketBubble(true);
    else setChat((prev) => [...prev, { user: "assistant", message: `📄 Summary: ${result.summary}` }]);
  } catch {
    setChat((prev) => [...prev, { user: "assistant", message: "[Error generating summary]" }]);
  }
};

  const handleTicketChoice = (create: boolean) => {
    if (create && summaryData?.tickets_created?.length) {
      summaryData.tickets_created.forEach((t: any) => {
        setChat((prev) => [...prev, { user: "assistant", message: `✅ Ticket created: ${t.ticket_id} for blocker "${t.blocker}"` }]);
      });
    }
    setChat((prev) => [...prev, { user: "assistant", message: `📄 Summary: ${summaryData?.summary}` }]);
    setShowTicketBubble(false);
  };

  const styles: { [key: string]: CSSProperties } = {
    container: { width: 500, maxWidth: "90%", height: 650, display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", fontFamily: "Inter, sans-serif", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", color: "#fff", padding: 0, position: "relative", margin: "40px auto" },
    header: { padding: "12px 16px", textAlign: "center", color: "#fff", fontWeight: 600, background: "rgba(255,255,255,0.15)" },
    window: { flex: 1, padding: "12px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.05)", borderRadius: 12, margin: "8px", position: "relative" },
    inputRow: { display: "flex", padding: 8, gap: 8 },
    input: { flex: 1, padding: 8, borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "#fff", outline: "none" },
    bubbleUser: { alignSelf: "flex-end", background: "rgba(255,255,255,0.2)", color: "#000", padding: 8, borderRadius: 16, maxWidth: "80%", wordBreak: "break-word" },
    bubbleAI: { alignSelf: "flex-start", background: "rgba(255,255,255,0.15)", color: "#fff", padding: 8, borderRadius: 16, maxWidth: "80%", wordBreak: "break-word" },
    typing: { fontStyle: "italic", opacity: 0.7 },
    summaryBox: { marginTop: 10, padding: 12, borderRadius: 16, background: "rgba(0,0,0,0.25)", color: "#fff", fontWeight: 500 },
    ticketBubble: { position: "absolute", bottom: 80, right: 20, padding: 10, borderRadius: 20, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 8 },
    ticketText: { color: "#fff", fontWeight: 500 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>AI Shadow Chat</div>
      <div style={styles.window} ref={chatWindowRef}>
        {chat.map((m, idx) => <div key={idx} style={m.user === "user" ? styles.bubbleUser : styles.bubbleAI}>{m.message}</div>)}
        {aiTyping && <div style={styles.typing}>AI typing...</div>}
        {summaryData && !showTicketBubble && <div style={styles.summaryBox}>📄 Summary: {summaryData.summary}</div>}
        {showTicketBubble && (
          <div style={styles.ticketBubble}>
            <span style={styles.ticketText}>🚨 Blockers detected. Create tickets?</span>
            <IconButton style={{ color: "#0f0" }} onClick={() => handleTicketChoice(true)} size="small"><CheckIcon /></IconButton>
            <IconButton style={{ color: "#f00" }} onClick={() => handleTicketChoice(false)} size="small"><CloseIcon /></IconButton>
          </div>
        )}
      </div>
      <div style={styles.inputRow}>
        <input style={styles.input} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." />
        <Button variant="contained" onClick={handleSend}>Send</Button>
        <Button color="secondary" variant="outlined" onClick={handleEndChat}>End Chat</Button>
      </div>
    </div>
  );
};

export default ChatBox;