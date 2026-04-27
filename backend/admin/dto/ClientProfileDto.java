package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfileDto {
    private Long userId;
    private String name;
    private String email;
    private String company;
    private String phone;
    private String timezone;
    private String profilePicture;
}
