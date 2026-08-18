package com.admin.dto;

import com.admin.entity.ProjectFile;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectFileResponse {
    private Long id;
    private Long projectId;
    private String originalFileName;
    private String storedFileName;
    private String fileType;
    private Long fileSize;
    private String uploadedByName;
    private String uploadedByEmail;
    private Instant uploadedAt;

    public static ProjectFileResponse fromEntity(ProjectFile entity) {
        return ProjectFileResponse.builder()
                .id(entity.getId())
                .projectId(entity.getProject().getId())
                .originalFileName(entity.getOriginalFileName())
                .storedFileName(entity.getStoredFileName())
                .fileType(entity.getFileType())
                .fileSize(entity.getFileSize())
                .uploadedByName(entity.getUploadedBy().getName())
                .uploadedByEmail(entity.getUploadedBy().getEmail())
                .uploadedAt(entity.getUploadedAt())
                .build();
    }
}
