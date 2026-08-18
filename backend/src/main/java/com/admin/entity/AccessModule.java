package com.admin.entity;

public enum AccessModule {
    DASHBOARD("Dashboard", "Basic overview access"),
    TASKS("Tasks", "Task workflows and boards"),
    CHAT("Chat", "Messaging and announcements"),
    FILES("Files", "Uploads and downloads"),
    REPORTS("Reports", "Exports and analytics");

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
