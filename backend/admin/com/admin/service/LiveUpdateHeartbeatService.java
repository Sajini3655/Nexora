package com.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LiveUpdateHeartbeatService {

    private final LiveUpdatePublisher liveUpdatePublisher;

    @Scheduled(fixedDelayString = "${app.live-updates.system-health-interval-ms:30000}")
    public void publishSystemHealthHeartbeat() {
        liveUpdatePublisher.publishSystemHealthPulse();
    }
}
