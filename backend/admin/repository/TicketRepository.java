package com.admin.repository;

import com.admin.entity.Ticket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    long countByCreatedBy_Id(Long userId);
    long countByAssignedTo_Id(Long userId);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    List<Ticket> findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(Long createdById, Long assignedToId);

    @Query("""
        SELECT t FROM Ticket t
        WHERE t.project.manager.id = :managerId
           OR t.createdBy.id = :createdById
           OR t.assignedTo.id = :assignedToId
        ORDER BY t.createdAt DESC
    """)
    List<Ticket> findByProjectManagerIdOrCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(
            @Param("managerId") Long managerId,
            @Param("createdById") Long createdById,
            @Param("assignedToId") Long assignedToId
    );

    @EntityGraph(attributePaths = {"project"})
    List<Ticket> findTop5BySourceChannelIgnoreCaseOrSourceEmailIsNotNullOrderByCreatedAtDesc(
            String sourceChannel
    );
}