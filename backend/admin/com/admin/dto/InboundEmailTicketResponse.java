package com.admin.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class InboundEmailTicketResponse {
    private boolean ignored;
    private String reason;
    private TicketDto ticket;
}
