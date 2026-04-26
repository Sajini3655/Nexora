package com.admin.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InboundEmailTicketRequest {
    private String fromEmail;
    private String subject;
    private String body;
    private Long projectId;
    private String projectName;
}
