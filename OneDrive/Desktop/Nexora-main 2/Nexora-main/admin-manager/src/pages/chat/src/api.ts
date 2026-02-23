// api.ts
export async function sendMessage(
  messages: any[],              // full chat array
  projectId: string,
  onChunk?: (chunk: string) => void
) {
  const res = await fetch("http://127.0.0.1:8000/chat/message", {  // <-- correct endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, projectId }),
  });

  if (!res.ok) throw new Error("Failed to send message");

  const data = await res.json();

  if (onChunk && data.text) {
    const text = data.text;
    for (let i = 0; i < text.length; i += 8) {
      onChunk(text.slice(i, i + 8));
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  return data.text;
}

export async function endChat(messages: any[], taskId: string) {  // changed projectId → taskId
  const res = await fetch("http://127.0.0.1:8000/chat/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, task_id: taskId }),  // <-- send task_id
  });

  if (!res.ok) throw new Error("Failed to end chat");
  return res.json();
}