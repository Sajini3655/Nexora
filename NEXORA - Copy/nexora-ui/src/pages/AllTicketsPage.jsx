import { useEffect, useState } from "react";
import { fetchManagerTickets } from "../api/managerTicketsApi";
import Card from "../ui/Card";

const tabs = [
  { key: "all", label: "All Tickets" },
  { key: "email", label: "Email Tickets" },
  { key: "portal", label: "Client Tickets" },
  { key: "chatbot", label: "Chatbot Tickets" },
];

function Badge({ text }) {
  return <span className="pill">{text}</span>;
}

export default function AllTicketsPage() {
  const [tab, setTab] = useState("all");
  const [data, setData] = useState({ count: 0, tickets: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setErr("");
      setLoading(true);
      try {
        if (tab === "chatbot") {
          if (alive) setData({ count: 0, tickets: [] });
        } else {
          const res = await fetchManagerTickets(tab);
          if (alive) setData(res);
        }
      } catch (e) {
        if (alive) setErr(String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [tab]);

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 1100 }}>
      <Card
        title="Manager  All Tickets"
        subtitle="Email + Client portal tickets in one view."
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="btn"
                style={{
                  background: tab === t.key ? "rgba(124,92,255,0.22)" : undefined
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Badge text={`Total: ${data.count}`} />
        </div>

        {err && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(255,0,0,0.3)", background: "rgba(255,0,0,0.08)" }}>
            {err}
          </div>
        )}

        {loading && <div style={{ marginTop: 12, color: "var(--muted)" }}>Loading tickets...</div>}
      </Card>

      <div style={{ display: "grid", gap: 10 }}>
        {data.tickets.map((t) => (
          <Card key={t.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900 }}>{t.title}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge text={`Source: ${t.source}`} />
                <Badge text={`Priority: ${t.priority}`} />
                <Badge text={`Status: ${t.status}`} />
              </div>
            </div>

            {t.summary && <div style={{ marginTop: 8, color: "var(--text)" }}>{t.summary}</div>}

            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>
              ID: {t.id} {t.reported_by ? ` By: ${t.reported_by}` : ""} {t.created_at ? ` ${t.created_at}` : ""}
            </div>
          </Card>
        ))}

        {!loading && data.tickets.length === 0 && (
          <Card>
            <div style={{ color: "var(--muted)" }}>No tickets found for this tab.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
