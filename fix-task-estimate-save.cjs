const fs = require("fs");

const backendPath = "backend/admin/com/admin/service/TaskAssignmentService.java";
const frontendPath = "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx";

let backend = fs.readFileSync(backendPath, "utf8");
let frontend = fs.readFileSync(frontendPath, "utf8");

// ===============================
// FIX 1: Backend must save estimatedPoints
// ===============================
if (!backend.includes("task.setEstimatedPoints(req.getEstimatedPoints());")) {
  backend = backend.replace(
    `task.setDueDate(req.getDueDate());
        if (req.getStatus() != null) {`,
    `task.setDueDate(req.getDueDate());
        task.setEstimatedPoints(req.getEstimatedPoints());
        if (req.getStatus() != null) {`
  );
}

fs.writeFileSync(backendPath, backend, "utf8");
console.log("Fixed backend estimatedPoints saving.");

// ===============================
// FIX 2: Frontend should keep modal state after save
// ===============================
frontend = frontend.replace(
  `setTaskDraft({});
      setSuccess("Task details updated successfully.");
      projectDetailsQuery.refetch();`,
  `const updatedDraft = {
        title: getTaskTitle(updated),
        description: getTaskDescription(updated),
        priority: getTaskPriority(updated),
        dueDate: updated?.dueDate || "",
        status: getTaskStatus(updated),
        estimatedPoints: Number(updated?.estimatedPoints ?? 0),
      };

      setSelectedTask(updated);
      setTaskDraft(updatedDraft);
      setOriginalTaskDraft(JSON.parse(JSON.stringify(updatedDraft)));
      setSuccess("Task details updated successfully.");
      await projectDetailsQuery.refetch();`
);

fs.writeFileSync(frontendPath, frontend, "utf8");
console.log("Fixed frontend modal state after saving task details.");
