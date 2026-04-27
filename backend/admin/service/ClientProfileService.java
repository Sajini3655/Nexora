package com.admin.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.admin.dto.ClientProfileDto;
import com.admin.entity.ClientProfile;
import com.admin.entity.User;
import com.admin.exception.ResourceNotFoundException;
import com.admin.repository.ClientProfileRepository;
import com.admin.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClientProfileService {

    private final UserRepository userRepository;
    private final ClientProfileRepository profileRepository;

    @Transactional
    public ClientProfileDto getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClientProfile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> profileRepository.save(ClientProfile.builder()
                        .user(user)
                        .build()));

        return toDto(user, profile);
    }

    @Transactional
    public ClientProfileDto updateMyProfile(String email, ClientProfileDto req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ClientProfile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> profileRepository.save(ClientProfile.builder()
                        .user(user)
                        .build()));

        if (req.getCompany() != null) {
            profile.setCompany(req.getCompany());
        }
        if (req.getPhone() != null) {
            profile.setPhone(req.getPhone());
        }
        if (req.getTimezone() != null) {
            profile.setTimezone(req.getTimezone());
        }
        if (req.getProfilePicture() != null) {
            profile.setProfilePicture(req.getProfilePicture());
        }

        profile = profileRepository.save(profile);
        return toDto(user, profile);
    }

    @Transactional
    public String uploadProfilePicture(String email, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or missing");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Validate file size (5MB max)
        long maxFileSize = 5L * 1024 * 1024;
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path uploadDir = Paths.get("uploads/profiles");
            
            // Create directory if it doesn't exist
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            
            Path filePath = uploadDir.resolve(fileName);
            Files.write(filePath, file.getBytes());

            String profilePictureUrl = "/uploads/profiles/" + fileName;

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            ClientProfile profile = profileRepository.findByUserId(user.getId())
                    .orElseGet(() -> profileRepository.save(ClientProfile.builder()
                            .user(user)
                            .build()));

            profile.setProfilePicture(profilePictureUrl);
            profileRepository.save(profile);

            return profilePictureUrl;
        } catch (IOException e) {
            throw new IOException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    private ClientProfileDto toDto(User user, ClientProfile profile) {
        return ClientProfileDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .company(profile.getCompany())
                .phone(profile.getPhone())
                .timezone(profile.getTimezone())
                .profilePicture(profile.getProfilePicture())
                .build();
    }
}
