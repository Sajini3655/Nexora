package com.admin.entity;

public enum AccessModule {
    DASHBOARD("Dashboard", "Basic overview access"),
    PROJECTS("Projects", "Project management and details"),
    TASKS("Tasks", "Task workflows and boards"),
    TICKETS("Tickets", "Ticket handling and tracking"),
    TIMESHEETS("Timesheets", "Time logging and approvals"),
    USERS("Users", "User management and roles"),
    CHAT("Chat", "Messaging and announcements"),
    AI_PROJECT_CHAT("AI Project Chat", "AI-assisted project chat"),
    AI_SUMMARIZATION("AI Summarization", "AI ticket and chat summarization"),
    AI_TICKET_CREATION("AI Ticket Creation", "AI-assisted ticket creation"),
    AI_DEVELOPER_SUGGESTION("AI Developer Suggestion", "AI-assisted developer suggestions"),
    NATURAL_LANGUAGE_NAVIGATION("Natural Language Navigation", "Natural language navigation");

    private final String label;
    private final String description;

    AccessModule(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }
}
