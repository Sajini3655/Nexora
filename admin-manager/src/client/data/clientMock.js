export const clientSummary = {
  activeProjects: 2,
  openTickets: 3,
  completedMilestones: 5,
  nextReview: "2026-04-30",
};

export const clientProjects = [
  {
    id: "CP-101",
    name: "Nexora Manager Platform",
    manager: "Manager Team",
    progress: 78,
    status: "In Progress",
    eta: "2026-05-08",
  },
  {
    id: "CP-102",
    name: "Client Insights Dashboard",
    manager: "Delivery Squad",
    progress: 42,
    status: "Planning",
    eta: "2026-05-20",
  },
];

export const clientTickets = [
  {
    id: "CT-9001",
    title: "Need export with custom filters",
    priority: "MEDIUM",
    status: "Open",
    updatedAt: "2026-04-23",
  },
  {
    id: "CT-9002",
    title: "Notification digest format",
    priority: "LOW",
    status: "In Review",
    updatedAt: "2026-04-22",
  },
  {
    id: "CT-9003",
    title: "Project member visibility",
    priority: "HIGH",
    status: "Open",
    updatedAt: "2026-04-24",
  },
];

export const clientProfile = {
  name: "Client User",
  email: "client@nexora.com",
  company: "Nexora Client Org",
  timezone: "Asia/Colombo",
};
