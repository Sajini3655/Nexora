const fs = require("fs");

const files = {
  dashboard: "admin-manager/src/manager/pages/dashboard/ManagerDashboard.jsx",
  progress: "admin-manager/src/manager/components/progress/ManagerDeveloperProgress.jsx",
  projectDetails: "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx",
  backendService: "backend/admin/com/admin/service/TaskAssignmentService.java",
};

function save(path, content) {
  fs.writeFileSync(path, content, "utf8");
  console.log("Updated:", path);
}

// ======================================================
// 1) ManagerDeveloperProgress.jsx
// Weighted/story progress must come from developer subtasks only.
// Do NOT fallback to estimatedPoints.
// ======================================================
let progress = fs.readFileSync(files.progress, "utf8");

progress = progress.replace(
  `const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
  const completedPointValue = Number(task?.completedPointValue ?? task?.completedStoryPoints ?? 0);`,
  `const totalPointValue = Number(task?.totalPointValue ?? 0);
  const completedPointValue = Number(task?.completedPointValue ?? 0);`
);

progress = progress.replace(
  `// Keep story point math aligned with weighted point math when story-point fields are absent.
    const totalStoryPoints = numberOrZero(task?.totalStoryPoints ?? task?.totalPointValue ?? task?.estimatedPoints);
    const completedStoryPoints = numberOrZero(
      task?.completedStoryPoints ?? task?.completedPointValue ?? (taskIsCompleted(task) ? totalStoryPoints : 0)
    );
    const totalPointValue = numberOrZero(
      task?.totalPointValue ?? task?.estimatedPoints ?? totalStoryPoints
    );
    const completedPointValue = numberOrZero(
      task?.completedPointValue ?? completedStoryPoints ?? (taskIsCompleted(task) ? totalPointValue : 0)
    );`,
  `// Story/weighted progress must come only from developer-created subtasks/story-point rows.
    // Manager task estimate is only a budget; it is NOT completed weighted progress.
    const totalStoryPoints = numberOrZero(task?.totalStoryPoints);
    const completedStoryPoints = numberOrZero(task?.completedStoryPoints);
    const totalPointValue = numberOrZero(task?.totalPointValue);
    const completedPointValue = numberOrZero(task?.completedPointValue);`
);

save(files.progress, progress);

// ======================================================
// 2) ManagerDashboard.jsx
// Top widgets and badges must not treat estimatedPoints as completed weighted points.
// ======================================================
let dash = fs.readFileSync(files.dashboard, "utf8");

dash = dash.replace(
  `const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
    const completedPointValue = Number(task?.completedPointValue ?? task?.completedStoryPoints ?? 0);`,
  `const totalPointValue = Number(task?.totalPointValue ?? 0);
    const completedPointValue = Number(task?.completedPointValue ?? 0);`
);

dash = dash.replace(
  `const totalPointValue = projectTaskList.reduce(
        (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0),
        0
      );`,
  `const totalPointValue = projectTaskList.reduce(
        (sum, task) => sum + Number(task?.totalPointValue ?? 0),
        0
      );`
);

dash = dash.replace(
  `const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
          const taskCompleted = Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));`,
  `const taskTotal = Number(task?.totalPointValue ?? 0);
          const taskCompleted = Number(task?.completedPointValue ?? 0);`
);

dash = dash.replace(
  `const totalPointValue = dashboardTasks.reduce(
      (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0),
      0
    );
    const completedPointValue = dashboardTasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? task?.completedStoryPoints ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0);`,
  `const totalPointValue = dashboardTasks.reduce(
      (sum, task) => sum + Number(task?.totalPointValue ?? 0),
      0
    );
    const completedPointValue = dashboardTasks.reduce((sum, task) => {
      return sum + Number(task?.completedPointValue ?? 0);
    }, 0);`
);

dash = dash.replace(
  `() => dashboardTasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0), 0),`,
  `() => dashboardTasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? 0), 0),`
);

dash = dash.replace(
  `const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? task?.completedStoryPoints ?? (isCompletedTask(task) ? taskTotal : 0));`,
  `return sum + Number(task?.completedPointValue ?? 0);`
);

dash = dash.replace(
  `const story =
        toNumber(task?.totalStoryPoints) ||
        toNumber(task?.storyPoints) ||
        toNumber(task?.estimatedPoints) ||
        toNumber(task?.points) ||
        toNumber(task?.totalPointValue) ||
        0;

      const weighted =
        toNumber(task?.totalPointValue) ||
        toNumber(task?.weightedPointsTotal) ||
        toNumber(task?.totalWeightedPoints) ||
        toNumber(task?.weight) ||
        story ||
        0;

      const completedStory =
        toNumber(task?.completedStoryPoints) ||
        toNumber(task?.storyPointsDone) ||
        toNumber(task?.completedPoints) ||
        toNumber(task?.completedPointValue) ||
        (done ? story : 0);

      const completedWeighted =
        toNumber(task?.completedPointValue) ||
        toNumber(task?.weightedPointsDone) ||
        toNumber(task?.completedWeightedPoints) ||
        toNumber(task?.doneWeightedPoints) ||
        (done ? weighted : 0);`,
  `const story = toNumber(task?.totalStoryPoints);

      const weighted = toNumber(task?.totalPointValue);

      const completedStory = toNumber(task?.completedStoryPoints);

      const completedWeighted = toNumber(task?.completedPointValue);`
);

save(files.dashboard, dash);

// ======================================================
// 3) ProjectManagementDetails.jsx
// Task table/project overview weighted points must come from story point rows only.
// estimatedPoints is only the manager budget.
// ======================================================
let details = fs.readFileSync(files.projectDetails, "utf8");

details = details.replace(
  `const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);`,
  `const totalPointValue = Number(task?.totalPointValue ?? 0);`
);

details = details.replace(
  `estimatedPoints: Number(task?.estimatedPoints ?? task?.totalPointValue ?? task?.totalStoryPoints ?? 0),`,
  `estimatedPoints: Number(task?.estimatedPoints ?? 0),`
);

save(files.projectDetails, details);

// ======================================================
// 4) Backend: update task estimatedPoints when manager edits task details.
// This keeps task budget saved, but still separate from weighted progress.
// ======================================================
let service = fs.readFileSync(files.backendService, "utf8");

if (!service.includes("task.setEstimatedPoints(req.getEstimatedPoints());")) {
  service = service.replace(
    `task.setDueDate(req.getDueDate());
        if (req.getStatus() != null) {`,
    `task.setDueDate(req.getDueDate());
        task.setEstimatedPoints(req.getEstimatedPoints());
        if (req.getStatus() != null) {`
  );
}

save(files.backendService, service);

console.log("Done. Manager estimates are now separated from developer weighted progress.");
