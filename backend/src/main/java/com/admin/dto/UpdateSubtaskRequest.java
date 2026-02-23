package com.admin.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSubtaskRequest {

    /** Optional title update. */
    private String title;

    /** Optional points update. */
    @Min(1)
    private Integer points;

    /** Optional done toggle/update. */
    private Boolean done;
}
