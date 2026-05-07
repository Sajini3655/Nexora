const fs = require("fs");

const file = "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx";
let s = fs.readFileSync(file, "utf8");

// 1. Manager task form must include estimatedPoints.
s = s.replace(
  /const emptyTaskForm = \{\s*title: "",\s*description: "",\s*priority: "MEDIUM",\s*dueDate: "",\s*assignedToId: "",\s*\};/s,
  `const emptyTaskForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
  estimatedPoints: 0,
};`
);

// 2. Add estimatedPoints into new task creation payload.
s = s.replace(
  /status: "TODO",\s*\}\);/,
  `status: "TODO",
        estimatedPoints: Number(newTask.estimatedPoints || 0),
      });`
);

// 3. Add estimatedPoints into taskDraft when opening modal.
s = s.replace(
  /status: getTaskStatus\(task\),\s*\};/,
  `status: getTaskStatus(task),
      estimatedPoints: Number(task?.estimatedPoints ?? task?.totalPointValue ?? task?.totalStoryPoints ?? 0),
    };`
);

// 4. Include estimatedPoints in unsaved-change detection.
s = s.replace(
  /taskDraft\?\.status !== originalTaskDraft\.status;/,
  `taskDraft?.status !== originalTaskDraft.status ||
      Number(taskDraft?.estimatedPoints || 0) !== Number(originalTaskDraft.estimatedPoints || 0);`
);

// 5. Include estimatedPoints in save-all changed check.
s = s.replace(
  /taskDraft\?\.status !== originalTaskDraft\?\.status;/,
  `taskDraft?.status !== originalTaskDraft?.status ||
        Number(taskDraft?.estimatedPoints || 0) !== Number(originalTaskDraft?.estimatedPoints || 0);`
);

// 6. Include estimatedPoints in updateManagerTask payloads.
s = s.replace(
  /status: \(taskDraft\?\.status \|\| "TODO"\)\.toUpperCase\(\),\s*\}\)\s*\);/,
  `status: (taskDraft?.status || "TODO").toUpperCase(),
            estimatedPoints: Number(taskDraft?.estimatedPoints || 0),
          })
        );`
);

s = s.replace(
  /status: taskStatus,\s*\}\);/,
  `status: taskStatus,
        estimatedPoints: Number(taskDraft?.estimatedPoints || 0),
      });`
);

// 7. Add estimatedPoints field in Add New Task UI after due date field.
if (!s.includes('label="Story points estimate" value={newTask.estimatedPoints}')) {
  s = s.replace(
    /(<TextField\s+size="small"\s+label="Due date"[\s\S]*?InputLabelProps=\{\{ shrink: true \}\}\s+\/>\s*)/,
    `$1

            <TextField
              size="small"
              label="Story points estimate"
              type="number"
              inputProps={{ min: 0 }}
              value={newTask.estimatedPoints}
              onChange={(e) => setNewTask((prev) => ({ ...prev, estimatedPoints: Math.max(0, Number(e.target.value) || 0) }))}
            />
`
  );

  s = s.replace(
    /gridTemplateColumns: \{ xs: "1fr", md: "1\.05fr 1\.2fr 0\.55fr 0\.7fr auto" \}/,
    `gridTemplateColumns: { xs: "1fr", md: "1.05fr 1.2fr 0.55fr 0.7fr 0.7fr auto" }`
  );
}

// 8. Add estimatedPoints field in modal Task Details UI after status field.
if (!s.includes('label="Story points estimate" value={taskDraft?.estimatedPoints || 0}')) {
  s = s.replace(
    /(<TextField size="small" select label="Status"[\s\S]*?<\/TextField>\s*)/,
    `$1
                <TextField
                  size="small"
                  label="Story points estimate"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={taskDraft?.estimatedPoints || 0}
                  onChange={(e) => setTaskDraft((prev) => ({ ...prev, estimatedPoints: Math.max(0, Number(e.target.value) || 0) }))}
                />
`
  );
}

// 9. Prevent manager from creating developer subtasks/story-point rows.
s = s.replace(
  /<Typography sx=\{\{ fontWeight: 900, mb: 1 \}\}>Story Points<\/Typography>/,
  `<Typography sx={{ fontWeight: 900, mb: 1 }}>Story Points</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>
                Manager should only set the task story point estimate above. The assigned developer splits that estimate into subtasks.
              </Typography>`
);

s = s.replace(
  /<Button variant="contained" onClick=\{handleCreateStoryPoint\} disabled=\{!canSaveStoryPoint \|\| savingStoryPoint\}>Add Story Point<\/Button>/,
  `<Button variant="contained" disabled>Developer splits points</Button>`
);

fs.writeFileSync(file, s, "utf8");
console.log("Patched manager task estimate flow.");
