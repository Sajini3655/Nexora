package com.admin.service;

import com.admin.dto.SystemHealthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.CompositeHealth;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class SystemHealthService {

    private final HealthEndpoint healthEndpoint;
    private final DataSource dataSource;

    @Value("${dashboard.refresh-interval-seconds:10}")
    private long refreshIntervalSeconds;

    @Value("${app.ai-service.health-url:http://localhost:8000/health}")
    private String aiServiceHealthUrl;

    @Value("${app.ai-service.timeout-ms:2000}")
    private int aiServiceTimeoutMs;

    public SystemHealthResponse getSystemHealth() {
        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        HealthComponent health = healthEndpoint.health();

        String overallStatus = health.getStatus().getCode();
        DatabaseProbeResult databaseProbeResult = probeDatabase();
        String databaseStatus = databaseProbeResult.status();
        if ("UNKNOWN".equalsIgnoreCase(databaseStatus)) {
            databaseStatus = resolveComponentStatus(health, "db");
        }

        String apiStatus = "UP".equalsIgnoreCase(overallStatus) ? "OK" : "DOWN";
        String mailStatus = resolveComponentStatus(health, "mail");
        String aiServiceStatus = probeAiServiceStatus();

        return SystemHealthResponse.builder()
                .apiStatus(apiStatus)
                .databaseStatus(databaseStatus)
                .databaseLatencyMs(databaseProbeResult.latencyMs())
                .mailStatus(mailStatus)
                .aiServiceStatus(aiServiceStatus)
                .uptime(formatUptime(uptimeMillis))
                .overallStatus(overallStatus)
                .lastCheckedAt(Instant.now().toString())
                .refreshIntervalSeconds(refreshIntervalSeconds)
                .build();
    }

    private String resolveComponentStatus(HealthComponent health, String componentName) {
        if (health instanceof CompositeHealth compositeHealth) {
            HealthComponent component = compositeHealth.getComponents().get(componentName);
            if (component != null) {
                return "UP".equalsIgnoreCase(component.getStatus().getCode()) ? "OK" : "DOWN";
            }
        }

        return "UNKNOWN";
    }

    private DatabaseProbeResult probeDatabase() {
        long startedAt = System.nanoTime();

        try (Connection connection = dataSource.getConnection()) {
            boolean valid = connection.isValid(2);
            long latencyMs = Duration.ofNanos(System.nanoTime() - startedAt).toMillis();

            if (valid) {
                return new DatabaseProbeResult("OK", latencyMs);
            }

            return new DatabaseProbeResult("DOWN", latencyMs);
        } catch (Exception ex) {
            return new DatabaseProbeResult("DOWN", null);
        }
    }

    private String probeAiServiceStatus() {
        if (aiServiceHealthUrl == null || aiServiceHealthUrl.isBlank()) {
            return "UNKNOWN";
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(aiServiceTimeoutMs))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(aiServiceHealthUrl))
                    .timeout(Duration.ofMillis(aiServiceTimeoutMs))
                    .GET()
                    .build();

            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            int statusCode = response.statusCode();
            return statusCode >= 200 && statusCode < 300 ? "OK" : "DOWN";
        } catch (Exception ex) {
            return "DOWN";
        }
    }

    private String formatUptime(long uptimeMillis) {
        Duration duration = Duration.ofMillis(uptimeMillis);

        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();

        if (days > 0) {
            return days + "d " + hours + "h " + minutes + "m";
        }
        if (hours > 0) {
            return hours + "h " + minutes + "m";
        }
        return minutes + "m";
    }

    private record DatabaseProbeResult(String status, Long latencyMs) {
    }
}