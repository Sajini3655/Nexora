const fs = require("fs");

const files = [
  "backend/admin/com/admin/service/ProjectService.java",
  "backend/admin/com/admin/service/TaskAssignmentService.java",
  "backend/admin/com/admin/service/DeveloperTaskService.java",
  "backend/admin/com/admin/service/TicketService.java"
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log("Missing, skipped:", file);
    continue;
  }

  let code = fs.readFileSync(file, "utf8");
  const before = code;

  // Add estimatedPoints after dueDate in TaskDto.builder blocks using variable "task"
  code = code.replace(
    /\.dueDate\(task\.getDueDate\(\)\)\s*\n\s*\.createdById/g,
    `.dueDate(task.getDueDate())
                .estimatedPoints(task.getEstimatedPoints())
                .createdById`
  );

  // Add estimatedPoints after dueDate in TaskDto.builder blocks using variable "t"
  code = code.replace(
    /\.dueDate\(t\.getDueDate\(\)\)\s*\n\s*\.createdById/g,
    `.dueDate(t.getDueDate())
                .estimatedPoints(t.getEstimatedPoints())
                .createdById`
  );

  // Remove accidental duplicates if already present twice
  code = code.replace(
    /(\.estimatedPoints\((?:task|t)\.getEstimatedPoints\(\)\)\s*\n\s*){2,}/g,
    (match) => match.split("\n")[0] + "\n"
  );

  if (code !== before) {
    fs.writeFileSync(file, code, "utf8");
    console.log("Updated:", file);
  } else {
    console.log("No change:", file);
  }
}

console.log("Done. Now compile backend and rebuild frontend.");
