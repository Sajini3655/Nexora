import React, { useState } from "react";
import { useParams } from "react-router-dom";
import ChatBox from "./src/ChatBox";

const DevChat = () => {
  const { projectId } = useParams(); // get projectId from route
  const [summary, setSummary] = useState(null);

  return (
    <div style={{ padding: 20 }}>
      <h2>Developer Chat</h2>

      <ChatBox
        projectId={projectId}           // required for backend
        onSummary={(data) => setSummary(data)} // summary callback
      />

      {summary && (
        <div style={{ marginTop: 20, background: "#222", padding: 16, borderRadius: 12 }}>
          <h3>Chat Summary</h3>
          <p>{summary.summary}</p>
          {summary.tickets_created?.length > 0 && (
            <div>
              <h4>Tickets Created:</h4>
              <ul>
                {summary.tickets_created.map((t) => (
                  <li key={t.ticket_id}>{t.ticket_id}: {t.blocker}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevChat;