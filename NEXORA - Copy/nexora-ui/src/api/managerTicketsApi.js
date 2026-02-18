const BASE = "http://127.0.0.1:8002/api";

export async function fetchManagerTickets(source = "all") {
  const url = `${BASE}/manager/tickets?source=${encodeURIComponent(source)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { count, tickets }
}
