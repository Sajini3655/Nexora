package com.admin.repository;

import com.admin.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    long countByCreatedBy_Id(Long userId);
    long countByAssignedTo_Id(Long userId);
}