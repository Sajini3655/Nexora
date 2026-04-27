package com.admin.service;

import com.admin.dto.AuditLogDto;
import com.admin.entity.AuditLog;
import com.admin.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String actorEmail, String targetEmail, String details) {
        try {
            AuditLog log = AuditLog.builder()
                    .action(action != null ? action : "UNKNOWN_ACTION")
                    .actorEmail(
                            actorEmail != null && !actorEmail.isBlank()
                                    ? actorEmail
                                    : "system"
                    )
                    .targetEmail(targetEmail)
                    .details(details)
                    .build();

            auditLogRepository.save(log);
            auditLogRepository.flush();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getRecentActivity() {
        try {
            return auditLogRepository.findTop10ByOrderByCreatedAtDesc()
                    .stream()
                    .map(log -> AuditLogDto.builder()
                            .action(log.getAction())
                            .actorEmail(log.getActorEmail())
                            .targetEmail(log.getTargetEmail())
                            .details(log.getDetails())
                            .createdAt(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null)
                            .build())
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}