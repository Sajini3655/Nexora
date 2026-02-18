import { useState } from "react";
import CategoryPicker from "./CategoryPicker";
import TicketForm from "./TicketForm";
import TicketPreview from "./TicketPreview";
import Card from "../../ui/Card";
import { summarizeTicket, createTicket } from "../../api/ticketsApi";

const emptyForm = {
  category: "",
  name: "",
  company: "",
  email: "",
  project: "",
  urgency: "Medium",
  description: "",
  steps: "",
  expected: "",
  actual: "",
};

function StepPill({ active, children }) {
  return (
    <span style={{
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid var(--border)",
      background: active ? "rgba(124,92,255,0.22)" : "rgba(255,255,255,0.04)",
      color: active ? "var(--text)" : "var(--muted)",
      fontSize: 12,
      fontWeight: 800
    }}>
      {children}
    </span>
  );
}

export default function TicketWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [ai, setAi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  const nextFromCategory = (cat) => {
    setForm((p) => ({ ...p, category: cat }));
    setStep(2);
  };

  const generate = async () => {
    setMsg("");
    setLoading(true);
    try {
      const out = await summarizeTicket(form);
      setAi(out);
      setStep(3);
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setMsg("");
    setCreating(true);
    try {
      const res = await createTicket(form, ai.raw);
      setMsg(`Ticket created: ${res.ticket.ticket_id}`);
      setForm(emptyForm);
      setAi(null);
      setStep(1);
    } catch (e) {
      setMsg(String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {msg && (
        <div style={{
          border: "1px solid var(--border)",
          background: "var(--panel2)",
          borderRadius: 14,
          padding: 12,
          maxWidth: 980
        }}>
          <b>{msg}</b>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StepPill active={step === 1}>1. Category</StepPill>
        <StepPill active={step === 2}>2. Details</StepPill>
        <StepPill active={step === 3}>3. Preview</StepPill>
      </div>

      {step === 1 && (
        <Card title="Select a category" subtitle="Choose the problem type related to your project.">
          <CategoryPicker value={form.category} onSelect={nextFromCategory} />
        </Card>
      )}

      {step === 2 && (
        <Card title="Fill ticket details" subtitle="Add enough info so the team can help faster.">
          <TicketForm
            form={form}
            setForm={setForm}
            onBack={() => setStep(1)}
            onNext={generate}
          />
          {loading && <div style={{ marginTop: 10, color: "var(--muted)" }}>Generating AI summary...</div>}
        </Card>
      )}

      {step === 3 && ai && (
        <Card title="Preview (AI Summary)" subtitle="Check the summary before creating the ticket.">
          <TicketPreview
            ai={ai}
            onBack={() => setStep(2)}
            onCreate={create}
            creating={creating}
          />
        </Card>
      )}
    </div>
  );
}
