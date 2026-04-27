package com.admin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.admin.entity.ClientHistory;

public interface ClientHistoryRepository extends JpaRepository<ClientHistory, Long> {

    List<ClientHistory> findByUser_IdAndTypeOrderByCompletedDateDesc(Long userId, ClientHistory.HistoryType type);

    List<ClientHistory> findByUser_IdOrderByCompletedDateDesc(Long userId);

    @Query("SELECT ch FROM ClientHistory ch WHERE ch.user.id = :userId AND ch.type = :type ORDER BY ch.completedDate DESC")
    List<ClientHistory> findHistoryByUserAndType(Long userId, ClientHistory.HistoryType type);
}
