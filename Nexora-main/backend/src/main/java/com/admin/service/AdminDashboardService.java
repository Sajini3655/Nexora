package com.admin.service;

import com.admin.dto.AdminDashboardResponse;
import com.admin.dto.AdminDashboardStatsResponse;
import com.admin.dto.DailyRegistrationDto;
import com.admin.dto.RecentUserDto;
import com.admin.repository.InviteTokenRepository;
import com.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final InviteTokenRepository inviteTokenRepository;

    public AdminDashboardResponse getDashboardData() {
        return AdminDashboardResponse.builder()
                .stats(getStats())
                .recentUsers(getRecentUsers())
                .build();
    }

    public AdminDashboardStatsResponse getStats() {
        LocalDate today = LocalDate.now();

        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();

        LocalDate weekStartDate = today.with(DayOfWeek.MONDAY);
        LocalDateTime startOfWeek = weekStartDate.atStartOfDay();

        long totalUsers = 0;
        long admins = 0;
        long managers = 0;
        long developers = 0;
        long clients = 0;
        long enabledUsers = 0;
        long disabledUsers = 0;
        long newUsersToday = 0;
        long newUsersThisWeek = 0;
        long pendingInvites = 0;

        try { totalUsers = userRepository.count(); } catch (Exception e) { e.printStackTrace(); }
        try { admins = userRepository.countByRole_NameIgnoreCase("ADMIN"); } catch (Exception e) { e.printStackTrace(); }
        try { managers = userRepository.countByRole_NameIgnoreCase("MANAGER"); } catch (Exception e) { e.printStackTrace(); }
        try { developers = userRepository.countByRole_NameIgnoreCase("DEVELOPER"); } catch (Exception e) { e.printStackTrace(); }
        try { clients = userRepository.countByRole_NameIgnoreCase("CLIENT"); } catch (Exception e) { e.printStackTrace(); }
        try { enabledUsers = userRepository.countByEnabled(true); } catch (Exception e) { e.printStackTrace(); }
        try { disabledUsers = userRepository.countByEnabled(false); } catch (Exception e) { e.printStackTrace(); }
        try { newUsersToday = userRepository.countByCreatedAtBetween(startOfToday, startOfTomorrow); } catch (Exception e) { e.printStackTrace(); }
        try { newUsersThisWeek = userRepository.countByCreatedAtBetween(startOfWeek, startOfTomorrow); } catch (Exception e) { e.printStackTrace(); }
        try { pendingInvites = inviteTokenRepository.countByUsedFalse(); } catch (Exception e) { e.printStackTrace(); }

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .admins(admins)
                .managers(managers)
                .developers(developers)
                .clients(clients)
                .enabledUsers(enabledUsers)
                .disabledUsers(disabledUsers)
                .newUsersToday(newUsersToday)
                .newUsersThisWeek(newUsersThisWeek)
                .pendingInvites(pendingInvites)
                .build();
    }

    public List<RecentUserDto> getRecentUsers() {
        try {
            return userRepository.findTop5ByOrderByCreatedAtDesc()
                    .stream()
                    .map(user -> RecentUserDto.builder()
                            .id(user.getId())
                            .name(user.getName())
                            .email(user.getEmail())
                            .role(user.getRole() != null ? user.getRole().getName() : "CLIENT")
                            .enabled(user.getEnabled())
                            .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                            .build())
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public List<DailyRegistrationDto> getRegistrationsLast7Days() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);

        Map<String, Long> rawCounts = new HashMap<>();

        try {
            List<Object[]> rows = userRepository.countRegistrationsGroupedByDay(start.atStartOfDay());

            for (Object[] row : rows) {
                String day = row[0] != null ? row[0].toString().trim() : "";
                long total = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                rawCounts.put(day, total);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        List<DailyRegistrationDto> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = start.plusDays(i);
            String label = date.getDayOfWeek().name().substring(0, 3);
            long total = rawCounts.getOrDefault(label.substring(0, 1) + label.substring(1).toLowerCase(), 0L);

            if (rawCounts.containsKey(label)) {
                total = rawCounts.get(label);
            }

            if (rawCounts.containsKey(label.substring(0, 1) + label.substring(1).toLowerCase())) {
                total = rawCounts.get(label.substring(0, 1) + label.substring(1).toLowerCase());
            }

            result.add(DailyRegistrationDto.builder()
                    .day(label)
                    .total(total)
                    .build());
        }

        return result;
    }
}