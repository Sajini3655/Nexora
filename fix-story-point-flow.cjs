const fs = require("fs");

const managerFile = "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx";
const devFile = "admin-manager/src/dev/pages/tasks/DevTaskView.jsx";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

function replaceOnce(text, search, replace, label) {
  if (!text.includes(search)) {
    throw new Error(`Pattern not found: ${label}`);
  }
  return text.replace(search, replace);
}

let manager = read(managerFile);
let dev = read(devFile);

// =====================================================
// MANAGER FIX:
// Manager should set task estimatedPoints only.
// Manager should NOT create story point/subtask rows.
// =====================================================

manager = replaceOnce(
  manager,
`const emptyTaskForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
};`,
`const emptyTaskForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
  estimatedPoints: "",
};`,
"emptyTaskForm add estimatedPoints"
);

manager = replaceOnce(
  manager,
`        status: getTaskStatus(task),
    };`,
`        status: getTaskStatus(task),
      estimatedPoints: Number(task?.estimatedPoints ?? task?.totalPointValue ?? 0),
    };`,
"taskDraft add estimatedPoints"
);

manager = replaceOnce(
  manager,
`      taskDraft?.dueDate !== originalTaskDraft.dueDate ||
      taskDraft?.status !== originalTaskDraft.status;`,
`      taskDraft?.dueDate !== originalTaskDraft.dueDate ||
      taskDraft?.status !== originalTaskDraft.status ||
      Number(taskDraft?.estimatedPoints || 0) !== Number(originalTaskDraft?.estimatedPoints || 0);`,
"hasUnsavedChanges include estimatedPoints"
);

manager = replaceOnce(
  manager,
`        status: "TODO",
      });`,
`        status: "TODO",
        estimatedPoints: Number(newTask.estimatedPoints || 0),
      });`,
"create task send estimatedPoints"
);

manager = replaceOnce(
  manager,
`              InputLabelProps={{ shrink: true }}
            />

            <Button variant="contained" disabled={!canAddTask || addingTask} onClick={handleAddTask}>`,
`              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              label="Story points"
              type="number"
              inputProps={{ min: 0 }}
              value={newTask.estimatedPoints}
              onChange={(e) => setNewTask((prev) => ({ ...prev, estimatedPoints: Math.max(0, Number(e.target.value) || 0) }))}
            />

            <Button variant="contained" disabled={!canAddTask || addingTask} onClick={handleAddTask}>`,
"add task story points field"
);

manager = manager.replace(
  `gridTemplateColumns: { xs: "1fr", md: "1.05fr 1.2fr 0.55fr 0.7fr auto" }`,
  `gridTemplateColumns: { xs: "1fr", md: "1.05fr 1.2fr 0.55fr 0.7fr 0.55fr auto" }`
);

manager = replaceOnce(
  manager,
`        estimatedPoints: 0, // No story points yet for new tasks`,
`        estimatedPoints: Number(newTask.estimatedPoints || 0),`,
"AI suggest add task estimatedPoints"
);

manager = replaceOnce(
  manager,
`        estimatedPoints: totalFromStoryPoints > 0 ? totalFromStoryPoints : Number(selectedTask?.estimatedPoints || 0),`,
`        estimatedPoints: Number(taskDraft?.estimatedPoints ?? selectedTask?.estimatedPoints ?? 0),`,
"AI suggest existing task estimatedPoints"
);

manager = replaceOnce(
  manager,
`            status: (taskDraft?.status || "TODO").toUpperCase(),
          })`,
`            status: (taskDraft?.status || "TODO").toUpperCase(),
            estimatedPoints: Number(taskDraft?.estimatedPoints || 0),
          })`,
"save all task details estimatedPoints"
);

manager = replaceOnce(
  manager,
`      const taskStatus = (taskDraft?.status || getTaskStatus(selectedTask) || "TODO").toUpperCase();

      const updated = await updateManagerTask(Number(selectedTask.id), {`,
`      const taskStatus = (taskDraft?.status || getTaskStatus(selectedTask) || "TODO").toUpperCase();
      const taskEstimatedPoints = Number(taskDraft?.estimatedPoints ?? selectedTask?.estimatedPoints ?? 0);

      const updated = await updateManagerTask(Number(selectedTask.id), {`,
"handleSaveTaskDetails estimatedPoints const"
);

manager = replaceOnce(
  manager,
`        status: taskStatus,
      });`,
`        status: taskStatus,
        estimatedPoints: taskEstimatedPoints,
      });`,
"handleSaveTaskDetails send estimatedPoints"
);

manager = replaceOnce(
  manager,
`                <TextField size="small" select label="Status" value={taskDraft?.status || "TODO"} onChange={(e) => setTaskDraft((prev) => ({ ...prev, status: e.target.value }))}>
                  <MenuItem value="TODO">TODO</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                </TextField>
                <TextField size="small" label="Description" value={taskDraft?.description || ""}`,
`                <TextField size="small" select label="Status" value={taskDraft?.status || "TODO"} onChange={(e) => setTaskDraft((prev) => ({ ...prev, status: e.target.value }))}>
                  <MenuItem value="TODO">TODO</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  label="Task story points"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={taskDraft?.estimatedPoints ?? 0}
                  onChange={(e) => setTaskDraft((prev) => ({ ...prev, estimatedPoints: Math.max(0, Number(e.target.value) || 0) }))}
                />
                <TextField size="small" label="Description" value={taskDraft?.description || ""}`,
"task modal story point budget field"
);

// Disable manager-side story-point creation.
// Developer should split the task budget into subtasks.
manager = manager.replace(
`<Button variant="contained" onClick={handleCreateStoryPoint} disabled={!canSaveStoryPoint || savingStoryPoint}>Add Story Point</Button>`,
`<Button variant="contained" disabled>
                    Developer splits points
                  </Button>`
);

manager = manager.replace(
`<Typography sx={{ fontWeight: 900, mb: 1 }}>Story Points</Typography>`,
`<Typography sx={{ fontWeight: 900, mb: 1 }}>Developer Subtasks / Story Point Split</Typography>`
);

manager = manager.replace(
`<Typography variant="body2" sx={{ color: "#94a3b8" }}>No story points yet.</Typography>`,
`<Typography variant="body2" sx={{ color: "#94a3b8" }}>Developer has not split this task into subtasks yet.</Typography>`
);

write(managerFile, manager);


// =====================================================
// DEVELOPER FIX:
// After developer creates a subtask/story point,
// immediately refetch story points, progress, and task.
// =====================================================

dev = replaceOnce(
  dev,
`                      await createMutation.mutateAsync({ taskId: task.id, data: { title: newTitle.trim(), description: null, pointValue: Number(newPoints) } });
                      setNewTitle("");`,
`                      await createMutation.mutateAsync({ taskId: task.id, data: { title: newTitle.trim(), description: null, pointValue: Number(newPoints) } });
                      await Promise.all([storyPointsQuery.refetch(), progressQuery.refetch(), taskQuery.refetch()]);
                      setNewTitle("");`,
"developer refetch after create story point"
);

write(devFile, dev);

console.log("Fixed story point flow: manager sets task budget, developer splits into subtasks.");
