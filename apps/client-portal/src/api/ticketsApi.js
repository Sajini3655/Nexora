const BASE = "http://127.0.0.1:8002/api";

export async function summarizeTicket(form) {
  const res = await fetch(`${BASE}/tickets/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTicket(form, ai) {
  const res = await fetch(`${BASE}/tickets/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form, ai }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
