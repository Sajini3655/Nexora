const BACKEND_URL = "http://localhost:8081/api/chat";
const AI_URL = "http://127.0.0.1:8000";

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function startSession(projectId: string) {
  const res = await fetch(`${BACKEND_URL}/start/${projectId}`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to start session");
  }

  return res.json();
}

export async function getMessages(sessionId: string) {
  const res = await fetch(`${BACKEND_URL}/messages/${sessionId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch messages");
  }

  return res.json();
}

export async function endChatAI(
  messages: any[],
  projectId: string,
  createTickets = false
) {
  const res = await fetch(`${AI_URL}/chat/end`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({
      messages,
      task_id: projectId,
      project_id: projectId,
      create_tickets: createTickets
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "AI failed");
  }

  return res.json();
}

export async function saveSummary(sessionId: string, summary: string) {
  const res = await fetch(`${BACKEND_URL}/end/${sessionId}`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({ summary })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save summary");
  }

  return res.json();
}