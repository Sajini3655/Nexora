package com.admin.dto;

/**
 * NLQ resolve response.
 *
 * status: OK | NOT_FOUND | NOT_ALLOWED | AMBIGUOUS | ERROR
 * type:   ROUTE | SCROLL
 */
public record NlqResolveResponse(
        String status,
        String type,
        String path,
        String targetId,
        String message
) {}