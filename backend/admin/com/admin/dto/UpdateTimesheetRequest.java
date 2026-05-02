package com.admin.dto;

import com.admin.entity.WorkLocation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTimesheetRequest {

    @NotNull
    private Long projectId;

    private Long taskId;

    @NotNull
    private LocalDate workDate;

    @NotNull
    @Positive
    private BigDecimal hours;

    @NotBlank
    private String description;

    @NotNull
    private WorkLocation workLocation;
}
