package com.admin.service;

import com.admin.dto.InboundEmailTicketRequest;
import com.admin.dto.InboundEmailTicketResponse;
import com.admin.dto.TicketDto;
import com.admin.entity.Project;
import com.admin.entity.Role;
import com.admin.entity.Ticket;
import com.admin.entity.User;
import com.admin.repository.ProjectRepository;
import com.admin.repository.TicketRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailTicketIngestionService {

    private static final Logger log = LoggerFactory.getLogger(EmailTicketIngestionService.class);

    private static final Set<String> ISSUE_KEYWORDS = Set.of(
            "bug", "issue", "error", "crash", "failed", "failing", "exception", "not working", "broken", "defect", "problem"
    );

    private static final Set<String> HIGH_PRIORITY_HINTS = Set.of(
            "urgent", "critical", "blocker", "production down", "data loss", "outage"
    );

    private static final Pattern PROJECT_PATTERN = Pattern.compile("project\\s*[:=-]\\s*([A-Za-z0-9 _-]{2,80})", Pattern.CASE_INSENSITIVE);

    private final TicketRepository ticketRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final EmailIssueClassifierService emailIssueClassifierService;
    private final LiveUpdatePublisher liveUpdatePublisher;
    private final MailService mailService;

    @Transactional
    public InboundEmailTicketResponse ingest(InboundEmailTicketRequest request) {
        String fromEmail = normalize(request.getFromEmail());
        String subject = trimOrDefault(request.getSubject(), "Email issue report");
        String body = trimOrDefault(request.getBody(), "");

        String scanText = (subject + "\n" + body).toLowerCase(Locale.ROOT);
        EmailIssueClassifierService.ClassificationResult aiClassification = emailIssueClassifierService.classify(subject, body);

        boolean isIssueByKeyword = containsAny(scanText, ISSUE_KEYWORDS);
        boolean shouldCreateTicket = aiClassification.isIssue() || isIssueByKeyword;

        if (!shouldCreateTicket) {
            return InboundEmailTicketResponse.builder()
                    .ignored(true)
                    .reason(aiClassification.isUnknown()
                            ? "Email ignored because no bug/issue keywords were detected"
                            : aiClassification.getReason())
                    .build();
        }

        User senderUser = fromEmail == null ? null : userRepository.findByEmailIgnoreCase(fromEmail).orElse(null);
        User senderClient = isClient(senderUser) ? senderUser : null;

        RoutingDecision routing = resolveRouting(request, subject, body, senderClient);

        Ticket ticket = Ticket.builder()
                .title(subject)
                .description(buildDescription(body, fromEmail, routing.project == null ? "UNASSIGNED" : routing.project.getName()))
                .status(routing.unassigned ? "UNASSIGNED" : "OPEN")
                .priority(classifyPriority(scanText))
                .createdBy(senderUser)
                .assignedTo(null)
                .manager(routing.manager)
                .client(senderClient)
                .project(routing.project)
                .sourceChannel("EMAIL")
                .sourceEmail(fromEmail)
                .sourceSubject(subject)
                .build();

        Ticket saved = ticketRepository.save(ticket);
        liveUpdatePublisher.publishTicketsChanged("created");

        log.info("email_ticket_routing ticketId={} projectId={} managerId={} clientId={} unassigned={} route={}",
                saved.getId(),
                routing.project == null ? null : routing.project.getId(),
                routing.manager == null ? null : routing.manager.getId(),
                senderClient == null ? null : senderClient.getId(),
                routing.unassigned,
                routing.reason);

        if (routing.manager != null && routing.manager.getEmail() != null && !routing.manager.getEmail().isBlank()) {
            mailService.sendManagerTicketNotification(
                    routing.manager.getEmail(),
                    routing.manager.getName(),
                    routing.project == null ? "Unspecified Project" : routing.project.getName(),
                    saved.getId(),
                    subject
            );
        }

        TicketDto dto = toTicketDto(saved);

        return InboundEmailTicketResponse.builder()
                .ignored(false)
                .reason(routing.reason)
                .ticket(dto)
                .build();
    }

    private RoutingDecision resolveRouting(InboundEmailTicketRequest request, String subject, String body, User senderClient) {
        Optional<Project> explicitProject = resolveProject(request, subject, body);
        if (explicitProject.isPresent()) {
            Project project = explicitProject.get();
            return new RoutingDecision(project, project.getManager(), false, "Ticket routed using explicit/inferred project match");
        }

        if (senderClient != null) {
            Set<Project> historicalProjects = new LinkedHashSet<>();
            ticketRepository.findByClientId(senderClient.getId()).stream()
                    .map(Ticket::getProject)
                    .filter(p -> p != null && p.getManager() != null)
                    .forEach(historicalProjects::add);

            if (historicalProjects.size() == 1) {
                Project project = historicalProjects.iterator().next();
                return new RoutingDecision(project, project.getManager(), false, "Ticket routed by client historical single-project match");
            }
        }

        return new RoutingDecision(null, null, true, "No reliable project/manager match. Routed to admin UNASSIGNED queue");
    }

    private Optional<Project> resolveProject(InboundEmailTicketRequest request, String subject, String body) {
        if (request.getProjectId() != null) {
            return projectRepository.findById(request.getProjectId());
        }

        String explicitName = normalize(request.getProjectName());
        if (explicitName != null) {
            Optional<Project> byName = projectRepository.findByNameIgnoreCase(explicitName);
            if (byName.isPresent()) {
                return byName;
            }
        }

        String extractedProject = extractProjectName(subject + "\n" + body);
        if (extractedProject != null) {
            Optional<Project> byName = projectRepository.findByNameIgnoreCase(extractedProject);
            if (byName.isPresent()) {
                return byName;
            }

            String lowered = extractedProject.toLowerCase(Locale.ROOT);
            List<Project> fuzzy = projectRepository.findAll().stream()
                    .filter(p -> p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(lowered))
                    .toList();
            if (fuzzy.size() == 1) {
                return Optional.of(fuzzy.get(0));
            }
        }

        return Optional.empty();
    }

    private boolean isClient(User user) {
        return user != null && user.getAllRoles().contains(Role.CLIENT);
    }

    private String classifyPriority(String scanText) {
        if (containsAny(scanText, HIGH_PRIORITY_HINTS)) {
            return "HIGH";
        }
        return "MEDIUM";
    }

    private String buildDescription(String body, String fromEmail, String projectName) {
        StringBuilder sb = new StringBuilder();
        if (body != null && !body.isBlank()) {
            sb.append(body.trim());
        }

        sb.append("\n\n---\n")
                .append("Source: EMAIL")
                .append("\nFrom: ").append(fromEmail == null ? "unknown" : fromEmail)
                .append("\nProject: ").append(projectName);

        return sb.toString();
    }

    private static String extractProjectName(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        Matcher matcher = PROJECT_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }

        String value = matcher.group(1);
        return value == null ? null : value.trim();
    }

    private static boolean containsAny(String source, Set<String> keywords) {
        if (source == null || source.isBlank()) {
            return false;
        }

        for (String keyword : keywords) {
            if (source.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private static String trimOrDefault(String value, String fallback) {
        String normalized = normalize(value);
        return normalized == null ? fallback : normalized;
    }

    private TicketDto toTicketDto(Ticket ticket) {
        return TicketDto.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .projectId(ticket.getProject() == null ? null : ticket.getProject().getId())
                .projectName(ticket.getProject() == null ? null : ticket.getProject().getName())
                .managerId(ticket.getManager() == null ? null : ticket.getManager().getId())
                .clientId(ticket.getClient() == null ? null : ticket.getClient().getId())
                .createdById(ticket.getCreatedBy() == null ? null : ticket.getCreatedBy().getId())
                .createdByName(ticket.getCreatedBy() == null ? null : ticket.getCreatedBy().getName())
                .assignedToId(ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getId())
                .assignedToName(ticket.getAssignedTo() == null ? null : ticket.getAssignedTo().getName())
                .sourceChannel(ticket.getSourceChannel())
                .sourceEmail(ticket.getSourceEmail())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private record RoutingDecision(Project project, User manager, boolean unassigned, String reason) {
    }
}
