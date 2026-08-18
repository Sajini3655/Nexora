package com.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimesheetOptionsResponse {

    private List<ProjectOption> projects;
    private List<ProjectTaskGroupOption> taskGroups;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectOption {
        private Long id;
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskOption {
        private Long id;
        private String title;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectTaskGroupOption {
        private Long projectId;
        private String projectName;
        private List<TaskOption> tasks;
    }
}