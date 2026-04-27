package com.admin.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.admin.dto.ClientHistoryDto;
import com.admin.dto.ClientHistoryResponse;
import com.admin.entity.ClientHistory;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ClientHistoryRepository;
import com.admin.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClientHistoryService {

    private final UserRepository userRepository;
    private final ClientHistoryRepository historyRepository;

    @Transactional
    public ClientHistoryResponse getMyHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<ClientHistory> allHistory = historyRepository.findByUser_IdOrderByCompletedDateDesc(user.getId());

        List<ClientHistoryDto> projects = allHistory.stream()
                .filter(h -> h.getType() == ClientHistory.HistoryType.PROJECT)
                .map(ClientHistoryDto::fromEntity)
                .collect(Collectors.toList());

        List<ClientHistoryDto> tickets = allHistory.stream()
                .filter(h -> h.getType() == ClientHistory.HistoryType.TICKET)
                .map(ClientHistoryDto::fromEntity)
                .collect(Collectors.toList());

        return ClientHistoryResponse.builder()
                .projects(projects)
                .tickets(tickets)
                .build();
    }

    @Transactional
    public void addProjectToHistory(Long userId, Long projectId, String projectName, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClientHistory history = ClientHistory.builder()
                .user(user)
                .type(ClientHistory.HistoryType.PROJECT)
                .itemId(projectId)
                .itemName(projectName)
                .description(description)
                .completedDate(LocalDateTime.now())
                .build();

        historyRepository.save(history);
    }

    @Transactional
    public void addTicketToHistory(Long userId, Long ticketId, String ticketSubject, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClientHistory history = ClientHistory.builder()
                .user(user)
                .type(ClientHistory.HistoryType.TICKET)
                .itemId(ticketId)
                .itemName(ticketSubject)
                .category(category)
                .completedDate(LocalDateTime.now())
                .build();

        historyRepository.save(history);
    }
}
