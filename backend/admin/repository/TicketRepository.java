package com.admin.repository;

import com.admin.entity.Ticket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    long countByCreatedBy_Id(Long userId);
    long countByAssignedTo_Id(Long userId);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    List<Ticket> findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(Long createdById, Long assignedToId);

    List<Ticket> findByProject_Manager_IdOrCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(
            Long managerId,
            Long createdById,
            Long assignedToId
    );

    @EntityGraph(attributePaths = {"project"})
    List<Ticket> findTop5BySourceChannelIgnoreCaseOrSourceEmailIsNotNullOrderByCreatedAtDesc(
            String sourceChannel
    );
}