package com.admin.controller;

import com.admin.dto.ProjectFileResponse;
import com.admin.service.ProjectFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectFileController {

    private final ProjectFileService projectFileService;

    /**
     * Upload a file to a project.
     * POST /api/manager/projects/{projectId}/files
     */
    @PostMapping("/{projectId}/files")
    public ResponseEntity<ProjectFileResponse> uploadProjectFile(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            ProjectFileResponse response = projectFileService.uploadProjectFile(projectId, file, authentication);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            log.error("File upload failed for project {}: {}", projectId, e.getMessage());
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    /**
     * Get all files for a project.
     * GET /api/manager/projects/{projectId}/files
     */
    @GetMapping("/{projectId}/files")
    public ResponseEntity<List<ProjectFileResponse>> getProjectFiles(
            @PathVariable Long projectId,
            Authentication authentication
    ) {
        List<ProjectFileResponse> files = projectFileService.getProjectFiles(projectId, authentication);
        return ResponseEntity.ok(files);
    }

    /**
     * Download a file.
     * GET /api/manager/projects/files/{fileId}/download
     */
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<byte[]> downloadProjectFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        try {
            byte[] fileContent = projectFileService.downloadProjectFile(fileId, authentication);
            
            // Note: In a real implementation, we should retrieve the original file name from the database
            // For now, we'll return the file with a generic name
            HttpHeaders headers = new HttpHeaders();
            headers.setContentDisposition(ContentDisposition.attachment().filename("file").build());
            headers.setContentLength(fileContent.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileContent);
        } catch (IOException e) {
            log.error("File download failed for file {}: {}", fileId, e.getMessage());
            throw new RuntimeException("File download failed: " + e.getMessage());
        }
    }

    /**
     * Delete a file.
     * DELETE /api/manager/projects/files/{fileId}
     */
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Map<String, String>> deleteProjectFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        try {
            projectFileService.deleteProjectFile(fileId, authentication);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (IOException e) {
            log.error("File deletion failed for file {}: {}", fileId, e.getMessage());
            throw new RuntimeException("File deletion failed: " + e.getMessage());
        }
    }
}
