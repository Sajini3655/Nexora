package com.admin.dto;

/**
 * Parsed intent returned by the LLM.
 * Keep this small and very strict.
 */
public record NavIntent(
        String destinationKey,
        Integer projectId
) {}