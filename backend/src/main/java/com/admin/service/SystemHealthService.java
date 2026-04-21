package com.admin.service;

import com.admin.dto.SystemHealthResponse;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.time.Duration;

@Service
public class SystemHealthService {

    public SystemHealthResponse getSystemHealth() {
        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();

        return SystemHealthResponse.builder()
                .apiStatus("OK")
                .databaseStatus("OK")
                .uptime(formatUptime(uptimeMillis))
                .overallStatus("UP")
                .build();
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
}