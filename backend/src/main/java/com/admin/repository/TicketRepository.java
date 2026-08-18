package com.admin.repository;

import com.admin.entity.Ticket;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    long countByCreatedBy_Id(Long userId);
    long countByAssignedTo_Id(Long userId);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findByManagerIdOrderByCreatedAtDesc(Long managerId);

    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findByProjectManagerIdOrderByCreatedAtDesc(Long managerId);

    @Query("SELECT t FROM Ticket t WHERE t.assignedTo.id = :developerId ORDER BY t.createdAt DESC")
    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findByAssignedDeveloperId(@Param("developerId") Long developerId);

    @Query("SELECT t FROM Ticket t WHERE t.client.id = :clientId ORDER BY t.createdAt DESC")
    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findByClientId(@Param("clientId") Long clientId);

    @Query("SELECT t FROM Ticket t WHERE t.client.id = :clientId OR (t.client IS NULL AND t.createdBy.id = :clientId) ORDER BY t.createdAt DESC")
    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findClientVisibleTickets(@Param("clientId") Long clientId);

    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findByProject_IdInOrderByCreatedAtDesc(Collection<Long> projectIds);

    @Query("SELECT t FROM Ticket t WHERE UPPER(COALESCE(t.status, '')) = UPPER(:status) AND t.manager.id = :managerId ORDER BY t.createdAt DESC")
    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findByStatusAndManagerId(@Param("status") String status, @Param("managerId") Long managerId);

    @Query("SELECT DISTINCT t FROM Ticket t LEFT JOIN t.project p LEFT JOIN p.manager pm WHERE t.manager.id = :managerId OR pm.id = :managerId ORDER BY t.createdAt DESC")
    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project", "manager", "client"})
    List<Ticket> findManagerVisibleTickets(@Param("managerId") Long managerId);

    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project"})
    List<Ticket> findByCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(Long createdById, Long assignedToId);

    @Query("""
        SELECT t FROM Ticket t
        WHERE t.project.manager.id = :managerId
           OR t.createdBy.id = :createdById
           OR t.assignedTo.id = :assignedToId
        ORDER BY t.createdAt DESC
    """)
    @EntityGraph(attributePaths = {"createdBy", "assignedTo", "project"})
    List<Ticket> findByProjectManagerIdOrCreatedByIdOrAssignedToIdOrderByCreatedAtDesc(
            @Param("managerId") Long managerId,
            @Param("createdById") Long createdById,
            @Param("assignedToId") Long assignedToId
    );

    @EntityGraph(attributePaths = {"project", "createdBy"})
    List<Ticket> findTop5BySourceChannelIgnoreCaseOrSourceEmailIsNotNullOrderByCreatedAtDesc(
            String sourceChannel
    );
}