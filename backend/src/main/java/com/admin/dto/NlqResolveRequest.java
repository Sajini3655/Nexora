package com.admin.dto;

/**
 * Request from frontend NLQ search bar.
 *
 * @param query       natural language query, e.g. "go to project management"
 * @param currentPath current route path in the frontend, e.g. "/manager"
 */
public record NlqResolveRequest(String query, String currentPath) {}