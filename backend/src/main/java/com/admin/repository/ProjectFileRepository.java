package com.admin.repository;

import com.admin.entity.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {

    List<ProjectFile> findByProject_IdOrderByUploadedAtDesc(Long projectId);

    Optional<ProjectFile> findByIdAndProject_Id(Long fileId, Long projectId);

    void deleteByProject_Id(Long projectId);
}
