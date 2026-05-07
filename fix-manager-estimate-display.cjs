const fs = require("fs");

const file = "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx";

let code = fs.readFileSync(file, "utf8");

// 1. Add safe estimate helper after getTaskPointTotals if missing
if (!code.includes("function getTaskEstimatePoints(task)")) {
  code = code.replace(
`function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled Project";
}`,
`function getTaskEstimatePoints(task) {
  const number = Number(
    task?.estimatedPoints ??
    task?.estimatePoints ??
    task?.storyPointEstimate ??
    task?.storyPointsEstimate ??
    0
  );

  return Number.isFinite(number) && number > 0 ? number : 0;
}

function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled Project";
}`
  );
}

// 2. Make modal open use helper instead of direct task?.estimatedPoints only
code = code.replace(
  /estimatedPoints:\s*Number\(task\?\.estimatedPoints\s*\?\?\s*0\),/g,
  "estimatedPoints: getTaskEstimatePoints(task),"
);

// 3. In Add New Task successful cache insert, force estimatedPoints into created task object
code = code.replace(
`{
              ...createdTask,
              projectId: createdTask.projectId ?? numericProjectId,
              projectName: createdTask.projectName ?? getProjectName(project),
            },`,
`{
              ...createdTask,
              estimatedPoints: Number(createdTask?.estimatedPoints ?? newTask.estimatedPoints ?? 0),
              projectId: createdTask.projectId ?? numericProjectId,
              projectName: createdTask.projectName ?? getProjectName(project),
            },`
);

// 4. After saving task details, force local savedTask to keep the typed estimate if backend response is missing/old
code = code.replace(
`const savedTask = selectedTask ? { ...selectedTask, ...updated } : updated;`,
`const savedEstimate = Number(updated?.estimatedPoints ?? taskDraft?.estimatedPoints ?? 0);
      const savedTask = selectedTask
        ? { ...selectedTask, ...updated, estimatedPoints: savedEstimate }
        : { ...updated, estimatedPoints: savedEstimate };`
);

// 5. After Save Task Details, update React Query manager task cache immediately
if (!code.includes("queryClient.setQueryData(tasksKey, (currentTasks) => {")) {
  code = code.replace(
`setOriginalTaskDraft(JSON.parse(JSON.stringify(updatedTaskDraft)));
      setSuccess("Task details updated successfully.");`,
`setOriginalTaskDraft(JSON.parse(JSON.stringify(updatedTaskDraft)));

      if (managerScope) {
        const tasksKey = managerKeys.tasks(managerScope);
        queryClient.setQueryData(tasksKey, (currentTasks) => {
          const list = Array.isArray(currentTasks) ? currentTasks : [];
          return list.map((task) =>
            String(task?.id) === String(savedTask.id)
              ? { ...task, ...savedTask, estimatedPoints: savedEstimate }
              : task
          );
        });
      }

      setSuccess("Task details updated successfully.");`
  );
}

// 6. Change Task List header from Story Points to Estimate
code = code.replace(
`{["Task", "Description", "Priority", "Status", "Assigned", "Story Points", "Weighted", "Progress", "Action"].map((header) => (`,
`{["Task", "Description", "Priority", "Status", "Assigned", "Estimate", "Weighted", "Progress", "Action"].map((header) => (`
);

// 7. Change Task List display from completedStoryPoints/totalStoryPoints to estimatedPoints
code = code.replace(
`<Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedStoryPoints}/{totals.totalStoryPoints}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedPointValue}/{totals.totalPointValue}</Typography>`,
`<Typography variant="body2" sx={{ color: "#cbd5e1" }}>{getTaskEstimatePoints(task)} pts</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedPointValue}/{totals.totalPointValue}</Typography>`
);

// 8. Remove duplicated estimatedPoints setter in backend service later separately if needed, but frontend build first.

fs.writeFileSync(file, code, "utf8");

console.log("Fixed manager task estimate display + cache update.");
