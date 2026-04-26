const BACKEND_API_URL = "http://localhost:8081/api";
const BACKEND_URL = `${BACKEND_API_URL}/chat`;
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
    method: "GET",
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
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      messages,
      task_id: projectId,
      project_id: projectId,
      create_tickets: createTickets,
    }),
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
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      summary: summary || "Chat ended. No summary was generated.",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to save summary");
  }

  return res.json();
}

export async function createProjectTicket(projectId: string, blocker: string) {
  const parsedProjectId = Number(projectId);

  const res = await fetch(`${BACKEND_API_URL}/tickets`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      title: `Chat blocker: ${blocker}`,
      description:
        `Source: CHAT_SUMMARY\n` +
        `Blocker: ${blocker}\n` +
        `Project ID: ${projectId}\n\n` +
        `This ticket was created from the developer chat after blocker detection.`,
      status: "OPEN",
      priority: "HIGH",
      sourceChannel: "CHAT_SUMMARY",
      sourceSubject: "Chat blocker detected",
      project: Number.isFinite(parsedProjectId) ? { id: parsedProjectId } : null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to create project ticket");
  }

  return res.json();
}