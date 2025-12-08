import { useState } from 'react';
import axios from 'axios';

export default function ChatWindow() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat", {
        message: input
      });

      const botMessage = { role: "assistant", content: res.data.reply };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to backend." }]);
    }
  }

  return (
    <div className="chat-window">
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message ${m.role === "user" ? "user" : "bot"}`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", padding: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message Shadow..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
