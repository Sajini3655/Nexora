import React, { useState } from "react";
import { sendMessage, endChat } from "./api";
import { Button } from "@mui/material";

function ChatBox({ onSummary }: any) {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<any[]>([]);
  const [aiTyping, setAiTyping] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;

    const userMsg = { user: "user", message: input };
    setChat((c) => [...c, userMsg]);
    setInput("");

    let aiText = "";
    setAiTyping(true);

    await sendMessage(input, (chunk) => {
      aiText += chunk;
      setChat((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? m
            : m
        ).concat([{ user: "assistant", message: aiText }])
      );
    });

    setAiTyping(false);
  }

  async function handleEndChat() {
    const result = await endChat(chat);
    onSummary(result);
  }

  return (
    <div className="chat-container">
      <div className="chat-window">
        {chat.map((m, index) => (
          <div key={index} className={m.user === "user" ? "msg user" : "msg ai"}>
            {m.message}
          </div>
        ))}

        {aiTyping && <div className="typing">AI typing...</div>}
      </div>

      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
        <Button color="secondary" variant="outlined" onClick={handleEndChat}>
          End Chat
        </Button>
      </div>
    </div>
  );
}

export default ChatBox;
