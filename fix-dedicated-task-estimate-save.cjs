const fs = require("fs");

const serviceJs = "admin-manager/src/services/managerService.js";
const detailsJs = "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx";
const controllerJava = "backend/admin/com/admin/controller/ManagerTaskController.java";
const serviceJava = "backend/admin/com/admin/service/TaskAssignmentService.java";

function read(path) {
  if (!fs.existsSync(path)) {
    console.error("Missing:", path);
    process.exit(1);
  }
  return fs.readFileSync(path, "utf8");
}

function write(path, code) {
  fs.writeFileSync(path, code, "utf8");
  console.log("Updated:", path);
}

/* ======================================================
   1) Frontend service: add dedicated estimate API
====================================================== */
let managerService = read(serviceJs);

if (!managerService.includes("updateManagerTaskEstimate")) {
  managerService += `

export const updateManagerTaskEstimate = async (taskId, estimatedPoints) => {
  const response = await api.patch(\`/manager/tasks/\${taskId}/estimate\`, {
    estimatedPoints: Number(estimatedPoints || 0),
  });
  return response.data;
};
`;
}

write(serviceJs, managerService);


/* ======================================================
   2) Frontend page: import and use dedicated estimate API
====================================================== */
let details = read(detailsJs);

details = details.replace(
  `updateManagerTask,`,
  `updateManagerTask,
  updateManagerTaskEstimate,`
);

// Add safe helper if missing
if (!details.includes("function getTaskEstimatePoints(task)")) {
  details = details.replace(
`function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled Project";
}`,
`function getTaskEstimatePoints(task) {
  const n = Number(
    task?.estimatedPoints ??
    task?.estimatePoints ??
    task?.storyPointEstimate ??
    task?.storyPointsEstimate ??
    0
  );
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled Project";
}`
  );
}

// Make modal read estimate using helper
details = details.replace(
  /estimatedPoints:\s*Number\(task\?\.estimatedPoints\s*\?\?\s*0\),/g,
  `estimatedPoints: getTaskEstimatePoints(task),`
);

// In handleSaveTaskDetails: replace update logic with dedicated estimate save after normal save
details = details.replace(
`const updated = await updateManagerTask(Number(selectedTask.id), {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate,
        status: taskStatus,
        estimatedPoints: Number(taskDraft?.estimatedPoints || 0),
      });

      const savedTask = selectedTask ? { ...selectedTask, ...updated } : updated;`,
`const estimateValue = Math.max(0, Number(taskDraft?.estimatedPoints || 0));

      await updateManagerTask(Number(selectedTask.id), {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate,
        status: taskStatus,
        estimatedPoints: estimateValue,
      });

      const updatedEstimateTask = await updateManagerTaskEstimate(Number(selectedTask.id), estimateValue);

      const savedTask = selectedTask
        ? { ...selectedTask, ...updatedEstimateTask, estimatedPoints: estimateValue }
        : { ...updatedEstimateTask, estimatedPoints: estimateValue };`
);

// In handleSaveAllChanges: use dedicated estimate endpoint too
details = details.replace(
`taskUpdatePromise = updateManagerTask(Number(selectedTask.id), {
          title: (taskDraft?.title || "").trim(),
          description: taskDraft?.description || "",
          priority: (taskDraft?.priority || "MEDIUM").toUpperCase(),
          dueDate: taskDraft?.dueDate || null,
          status: (taskDraft?.status || "TODO").toUpperCase(),
          estimatedPoints: Number(taskDraft?.estimatedPoints || 0),
        });`,
`const estimateValue = Math.max(0, Number(taskDraft?.estimatedPoints || 0));
        taskUpdatePromise = (async () => {
          await updateManagerTask(Number(selectedTask.id), {
            title: (taskDraft?.title || "").trim(),
            description: taskDraft?.description || "",
            priority: (taskDraft?.priority || "MEDIUM").toUpperCase(),
            dueDate: taskDraft?.dueDate || null,
            status: (taskDraft?.status || "TODO").toUpperCase(),
            estimatedPoints: estimateValue,
          });

          return updateManagerTaskEstimate(Number(selectedTask.id), estimateValue);
        })();`
);

// After adding new task, if backend response still misses estimate, force frontend state
details = details.replace(
`const createdTask = await createManagerTask({
        projectId: numericProjectId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
        assignedToId: newTask.assignedToId ? Number(newTask.assignedToId) : null,
        status: "TODO",
        estimatedPoints: Number(newTask.estimatedPoints || 0),
      });`,
`const estimateValue = Math.max(0, Number(newTask.estimatedPoints || 0));

      let createdTask = await createManagerTask({
        projectId: numericProjectId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
        assignedToId: newTask.assignedToId ? Number(newTask.assignedToId) : null,
        status: "TODO",
        estimatedPoints: estimateValue,
      });

      if (createdTask?.id != null) {
        createdTask = {
          ...createdTask,
          ...(await updateManagerTaskEstimate(Number(createdTask.id), estimateValue)),
          estimatedPoints: estimateValue,
        };
      }`
);

// In task list, show manager estimate instead of developer-created story point count
details = details.replace(
`{["Task", "Description", "Priority", "Status", "Assigned", "Story Points", "Weighted", "Progress", "Action"].map((header) => (`,
`{["Task", "Description", "Priority", "Status", "Assigned", "Estimate", "Weighted", "Progress", "Action"].map((header) => (`
);

details = details.replace(
`<Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedStoryPoints}/{totals.totalStoryPoints}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedPointValue}/{totals.totalPointValue}</Typography>`,
`<Typography variant="body2" sx={{ color: "#cbd5e1" }}>{getTaskEstimatePoints(task)} pts</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedPointValue}/{totals.totalPointValue}</Typography>`
);

write(detailsJs, details);


/* ======================================================
   3) Backend controller: add PATCH /manager/tasks/{id}/estimate
====================================================== */
let controller = read(controllerJava);

controller = controller.replace(
  `import java.util.List;`,
  `import java.util.List;
import java.util.Map;`
);

if (!controller.includes("updateTaskEstimate(")) {
  controller = controller.replace(
`    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateTaskDetails(
            Authentication authentication,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskAssignmentService.updateTaskDetails(authentication.getName(), taskId, request));
    }`,
`    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto> updateTaskDetails(
            Authentication authentication,
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskAssignmentService.updateTaskDetails(authentication.getName(), taskId, request));
    }

    @PatchMapping("/tasks/{taskId}/estimate")
    public ResponseEntity<TaskDto> updateTaskEstimate(
            Authentication authentication,
            @PathVariable Long taskId,
            @RequestBody Map<String, Object> payload
    ) {
        Object rawValue = payload == null ? null : payload.get("estimatedPoints");
        Integer estimatedPoints = 0;

        if (rawValue instanceof Number number) {
            estimatedPoints = number.intValue();
        } else if (rawValue != null) {
            estimatedPoints = Integer.parseInt(String.valueOf(rawValue));
        }

        return ResponseEntity.ok(
                taskAssignmentService.updateTaskEstimate(authentication.getName(), taskId, estimatedPoints)
        );
    }`
  );
}

write(controllerJava, controller);


/* ======================================================
   4) Backend service: add updateTaskEstimate method
====================================================== */
let service = read(serviceJava);

if (!service.includes("public TaskDto updateTaskEstimate(")) {
  service = service.replace(
`    @Transactional(readOnly = true)
    public List<TaskDto> listManagerTasks(String managerEmail) {`,
`    @Transactional
    public TaskDto updateTaskEstimate(String managerEmail, Long taskId, Integer estimatedPoints) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        TaskItem task = taskRepository.findById(Objects.requireNonNull(taskId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (task.getProject() == null || task.getProject().getManager() == null
                || !task.getProject().getManager().getId().equals(manager.getId())) {
            throw new AccessDeniedException("You can only update tasks for projects you manage");
        }

        int safeEstimate = estimatedPoints == null ? 0 : Math.max(0, estimatedPoints);
        task.setEstimatedPoints(safeEstimate);
        task.setUpdatedAt(LocalDateTime.now());

        TaskItem saved = taskRepository.save(task);
        TaskDto dto = toTaskDto(saved);
        liveUpdatePublisher.publishTasksChanged("estimate-updated");
        return dto;
    }

    @Transactional(readOnly = true)
    public List<TaskDto> listManagerTasks(String managerEmail) {`
  );
}

// Clean duplicated estimate set in updateTaskDetails
service = service.replace(
`        task.setEstimatedPoints(req.getEstimatedPoints() == null ? 0 : req.getEstimatedPoints());
        if (req.getStatus() != null) {
            task.setStatus(req.getStatus());
        }
        if (req.getEstimatedPoints() != null) {
            task.setEstimatedPoints(req.getEstimatedPoints() == null ? 0 : req.getEstimatedPoints());
        }`,
`        task.setEstimatedPoints(req.getEstimatedPoints() == null ? 0 : Math.max(0, req.getEstimatedPoints()));
        if (req.getStatus() != null) {
            task.setStatus(req.getStatus());
        }`
);

write(serviceJava, service);

console.log("Done: added dedicated task estimate save flow.");
