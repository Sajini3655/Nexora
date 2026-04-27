package com.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignTicketRequest {
    @NotNull
    private Long projectId;

    @NotNull
    private Long developerId;

    @Valid
    @NotEmpty(message = "Please add at least one story point before assigning this ticket.")
    private List<TicketStoryPointRequest> storyPoints;
}
