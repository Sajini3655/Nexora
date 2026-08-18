package com.admin.service;

import com.admin.dto.ProjectFileResponse;
import com.admin.entity.Project;
import com.admin.entity.ProjectFile;
import com.admin.entity.Role;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ProjectFileRepository;
import com.admin.repository.ProjectRepository;
import com.admin.repository.UserRepository;
import com.admin.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectFileService {

    private final ProjectFileRepository projectFileRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Upload a file to a project.
     * Only the project manager and assigned developers can upload files.
     */
    @Transactional
    public ProjectFileResponse uploadProjectFile(Long projectId, MultipartFile file, Authentication authentication) 
            throws IOException {
        
        User user = getAuthenticatedUser(authentication);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Authorization: only project manager and developers can upload
        if (!isProjectManager(project, user) && !isProjectDeveloper(projectId, user)) {
            throw new AccessDeniedException("You don't have permission to upload files to this project");
        }

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > 50 * 1024 * 1024) { // 50 MB limit
            throw new IllegalArgumentException("File size exceeds 50 MB limit");
        }

        // Create upload directory if it doesn't exist
        String projectUploadDir = uploadDir + File.separator + "projects" + File.separator + projectId;
        Path uploadPath = Paths.get(projectUploadDir);
        Files.createDirectories(uploadPath);

        // Generate unique stored file name
        String storedFileName = generateUniqueFileName(file.getOriginalFilename());
        Path filePath = uploadPath.resolve(storedFileName);

        // Save file to disk
        Files.write(filePath, file.getBytes());

        // Create and save metadata to database
        ProjectFile projectFile = ProjectFile.builder()
                .project(project)
                .originalFileName(file.getOriginalFilename())
                .storedFileName(storedFileName)
                .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileSize(file.getSize())
                .uploadPath(filePath.toString())
                .uploadedBy(user)
                .build();

        projectFile = projectFileRepository.save(projectFile);
        log.info("File uploaded: {} for project {}", storedFileName, projectId);

        return ProjectFileResponse.fromEntity(projectFile);
    }

    /**
     * Get all files for a project.
     * Only the project manager and assigned developers can view files.
     */
    @Transactional(readOnly = true)
    public List<ProjectFileResponse> getProjectFiles(Long projectId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Authorization: only project manager and developers can view
        if (!isProjectManager(project, user) && !isProjectDeveloper(projectId, user)) {
            throw new AccessDeniedException("You don't have permission to view files for this project");
        }

        return projectFileRepository.findByProject_IdOrderByUploadedAtDesc(projectId)
                .stream()
                .map(ProjectFileResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Download a file.
     * Only the project manager and assigned developers can download files.
     */
    @Transactional(readOnly = true)
    public byte[] downloadProjectFile(Long fileId, Authentication authentication) throws IOException {
        User user = getAuthenticatedUser(authentication);
        ProjectFile projectFile = projectFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Authorization: only project manager and developers can download
        if (!isProjectManager(projectFile.getProject(), user) && !isProjectDeveloper(projectFile.getProject().getId(), user)) {
            throw new AccessDeniedException("You don't have permission to download this file");
        }

        Path filePath = Paths.get(projectFile.getUploadPath());
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File not found on disk");
        }

        return Files.readAllBytes(filePath);
    }

    /**
     * Delete a file.
     * Only the project manager can delete files.
     */
    @Transactional
    public void deleteProjectFile(Long fileId, Authentication authentication) throws IOException {
        User user = getAuthenticatedUser(authentication);
        ProjectFile projectFile = projectFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        // Authorization: only project manager can delete
        if (!isProjectManager(projectFile.getProject(), user)) {
            throw new AccessDeniedException("You don't have permission to delete files from this project");
        }

        // Delete file from disk
        Path filePath = Paths.get(projectFile.getUploadPath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.info("File deleted from disk: {}", filePath);
        }

        // Delete metadata from database
        projectFileRepository.delete(projectFile);
        log.info("File record deleted: {}", fileId);
    }

    /**
     * Delete all files for a project (when project is deleted).
     */
    @Transactional
    public void deleteAllProjectFiles(Long projectId) throws IOException {
        List<ProjectFile> files = projectFileRepository.findByProject_IdOrderByUploadedAtDesc(projectId);
        
        for (ProjectFile file : files) {
            Path filePath = Paths.get(file.getUploadPath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        }

        projectFileRepository.deleteByProject_Id(projectId);
        log.info("All files deleted for project {}", projectId);
    }

    /**
     * Generate a unique file name to avoid collisions.
     */
    private String generateUniqueFileName(String originalFileName) {
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }

    /**
     * Get authenticated user from authentication.
     */
    private User getAuthenticatedUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    /**
     * Check if user is the project manager.
     */
    private boolean isProjectManager(Project project, User user) {
        return project.getManager() != null && project.getManager().getId().equals(user.getId());
    }

    /**
     * Check if user is assigned to any task in the project (as a developer).
     */
    private boolean isProjectDeveloper(Long projectId, User user) {
        return taskRepository.existsByProject_IdAndAssignedTo_Id(projectId, user.getId());
    }
}
