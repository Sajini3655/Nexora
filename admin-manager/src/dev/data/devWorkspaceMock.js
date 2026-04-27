// src/data/devWorkspaceMock.js

export const currentProject = {
  id: "P-001",
  name: "NEXORA - AI Project Management",
  code: "NEXORA",
  description:
    "AI-enhanced project management system with dashboards, task assignment, chat summaries and tickets.",
  manager: "Manager (Sup)",
  dueDate: "2026-03-20",
  progress: 58, // %
  members: [
    { name: "You", role: "Developer" },
    { name: "Kavindu", role: "Developer" },
    { name: "Ravindu", role: "Developer" },
    { name: "Manager (Sup)", role: "Manager" },
  ],
};

export const tasks = [
  {
    id: "T-11",
    title: "Implement task board UI",
    description:
      "Build the project tasks board UI in the developer workspace (assigned-only view) with progress based on subtask story points.",
    status: "Assigned",
    assignee: "You",
    dueDate: "2026-02-25",
    priority: "High",
    storyPoints: 8,
    subtasks: [
      { id: "T-11-ST-1", title: "Create columns", points: 2, done: true },
      { id: "T-11-ST-2", title: "Task card component", points: 3, done: true },
      { id: "T-11-ST-3", title: "Filters + search", points: 3, done: false },
    ],
  },
  {
    id: "T-12",
    title: "Project chat panel",
    description:
      "Design the chat panel UI inside the workspace (message list, composer, and AI summary placeholder).",
    status: "Pending",
    assignee: "You",
    dueDate: "2026-02-26",
    priority: "Medium",
    storyPoints: 5,
    subtasks: [
      { id: "T-12-ST-1", title: "Message list UI", points: 2, done: false },
      { id: "T-12-ST-2", title: "Composer UI", points: 1, done: false },
      { id: "T-12-ST-3", title: "AI summary panel", points: 2, done: false },
    ],
  },
  {
    id: "T-13",
    title: "DB schema for tickets",
    description:
      "Create database tables/relationships for ticketing and prepare indexes for performance.",
    status: "Assigned",
    assignee: "Kavindu",
    dueDate: "2026-02-27",
    priority: "High",
    storyPoints: 3,
    subtasks: [
      { id: "T-13-ST-1", title: "Tables + relations", points: 2, done: true },
      { id: "T-13-ST-2", title: "Indexes", points: 1, done: false },
    ],
  },
  {
    id: "T-14",
    title: "Login bug fix",
    description:
      "Investigate login failure edge case, apply fix, and add regression tests.",
    status: "Completed",
    assignee: "You",
    dueDate: "2026-02-18",
    priority: "Low",
    storyPoints: 2,
    subtasks: [
      { id: "T-14-ST-1", title: "Reproduce issue", points: 1, done: true },
      { id: "T-14-ST-2", title: "Fix + test", points: 1, done: true },
    ],
  },
];

export const chatMessages = [
  {
    id: 1,
    sender: "Manager (Sup)",
    role: "Manager",
    text: "Please focus on task board + chat in the developer workspace.",
    ts: "10:12",
  },
  {
    id: 2,
    sender: "You",
    role: "Developer",
    text: "Okay. I’ll finish the task board UI today and start chat panel next.",
    ts: "10:14",
  },
  {
    id: 3,
    sender: "Kavindu",
    role: "Developer",
    text: "I’m working on ticket DB schema and will push by tonight.",
    ts: "10:20",
  },
  {
    id: 4,
    sender: "You",
    role: "Developer",
    text: "Great. When ready, I’ll connect ticket widget to backend later.",
    ts: "10:22",
  },
];

export const aiSummaries = [
  {
    id: "S-1",
    title: "AI Summary (Recent 3 messages)",
    points: [
      "Developer will complete task board UI first, then chat panel.",
      "Kavindu working on ticket DB schema; will push tonight.",
      "Ticket widget backend integration planned after schema is ready.",
    ],
  },
  {
    id: "S-2",
    title: "Potential blockers",
    points: [
      "Ticket APIs not available yet (waiting for schema + endpoints).",
      "Chat AI summary needs backend pipeline (later step).",
    ],
  },
  {
    id: "S-3",
    title: "Next actions",
    points: [
      "Finish board UI + task status sections.",
      "Build chat panel UI with AI summary widget.",
      "Add ticket widget and ticket view page (next step).",
    ],
  },
];

// --------------------
// ✅ NEW: Ticket mocks
// --------------------

// Tickets from clients (created via email or direct message)
export const clientTickets = [
  {
    id: "TK-201",
    title: "Client cannot upload files (stuck at 0%)",
    status: "Open",
    severity: "High",
    createdVia: "EMAIL",
    createdAt: "2026-02-18 09:20",
    description:
      "Client reports file upload progress stays at 0%. Needs investigation on upload API and frontend request headers.",
    client: { name: "Client A", contact: "clienta@email.com" },
    evidence: {
      type: "EMAIL",
      snippet:
        "Hi team, uploads are stuck at 0% from yesterday. Tried different browsers. Please help urgently.",
    },
    suggestedSubtasks: [
      { id: "ST-201-1", title: "Reproduce upload issue locally", points: 2, done: false },
      { id: "ST-201-2", title: "Check API logs / request payload", points: 3, done: false },
      { id: "ST-201-3", title: "Fix + add validation + test", points: 5, done: false },
    ],
  },
  {
    id: "TK-202",
    title: "Change dashboard label text (minor UI)",
    status: "In Progress",
    severity: "Low",
    createdVia: "DIRECT_MESSAGE",
    createdAt: "2026-02-18 13:05",
    description:
      "Client asked to rename 'Deadlines' widget to 'Upcoming Deadlines' in developer dashboard.",
    client: { name: "Client B", contact: "@clientb" },
    evidence: {
      type: "DIRECT_MESSAGE",
      snippet: "Can you rename the 'Deadlines' label to 'Upcoming Deadlines'?",
    },
    suggestedSubtasks: [
      { id: "ST-202-1", title: "Update label in UI component", points: 1, done: true },
      { id: "ST-202-2", title: "Check responsiveness + typography", points: 1, done: false },
    ],
  },
];

// Tickets created by AI blocker detection (from chat summaries)
export const aiBlockerTickets = [
  {
    id: "TK-301",
    title: "Missing ticket API endpoints (blocker)",
    status: "Open",
    severity: "Medium",
    createdVia: "CHAT_SUMMARY",
    createdAt: "2026-02-18 16:40",
    description:
      "AI detected blocker: ticket widget cannot be integrated because ticket endpoints are not ready.",
    detectedFrom: {
      summaryId: "S-2",
      reason: "Ticket APIs not available yet (waiting for schema + endpoints).",
      relatedMessages: [
        "Ticket APIs not available yet (waiting for schema + endpoints).",
        "Ticket widget backend integration planned after schema is ready.",
      ],
    },
    evidence: {
      type: "AI_SUMMARY",
      snippet:
        "Blocker detected from project chat: ticket endpoints not available; cannot integrate ticket list in dashboard.",
    },
    suggestedSubtasks: [
      { id: "ST-301-1", title: "Align with backend on ticket endpoint contracts", points: 2, done: false },
      { id: "ST-301-2", title: "Mock ticket API responses for UI", points: 3, done: false },
      { id: "ST-301-3", title: "Integrate ticket list once endpoints exist", points: 5, done: false },
    ],
  },
];

// ✅ Optional: if any file still imports allTickets, this fixes it too
export const allTickets = [...clientTickets, ...aiBlockerTickets];

