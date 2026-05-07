const fs = require("fs");

const frontendPath = "admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx";
const requestPath = "backend/admin/com/admin/dto/UpdateTaskRequest.java";
const servicePath = "backend/admin/com/admin/service/TaskAssignmentService.java";
const dtoPath = "backend/admin/com/admin/dto/TaskDto.java";

function read(path) {
  if (!fs.existsSync(path)) {
    console.error("Missing file:", path);
    process.exit(1);
  }
  return fs.readFileSync(path, "utf8");
}

function write(path, code) {
  fs.writeFileSync(path, code, "utf8");
  console.log("Updated:", path);
}

// ======================================================
// 1) Frontend: make sure Save Task Details sends estimatedPoints
// ======================================================
let frontend = read(frontendPath);

// Add estimatedPoints into common task-details payload if missing.
// This targets payload objects that already contain title/description/priority/dueDate/status.
frontend = frontend.replace(
  /(status:\s*taskDraft\.status,\s*)/g,
  `$1
        estimatedPoints: Number(taskDraft.estimatedPoints ?? 0),
        `
);

// If payload uses getTaskStatus or draft status differently, also handle common status line.
frontend = frontend.replace(
  /(status:\s*getTaskStatus\([^)]*\),\s*)/g,
  `$1
        estimatedPoints: Number(taskDraft.estimatedPoints ?? 0),
        `
);

// Prevent accidental duplicate estimatedPoints lines.
frontend = frontend.replace(
  /(estimatedPoints:\s*Number\(taskDraft\.estimatedPoints \?\? 0\),\s*){2,}/g,
  `estimatedPoints: Number(taskDraft.estimatedPoints ?? 0),
        `
);

// After save, keep local modal state aligned with returned task if that pattern exists.
frontend = frontend.replace(
  /estimatedPoints:\s*Number\(updated\?\.estimatedPoints\s*\?\?\s*0\),/g,
  `estimatedPoints: Number(updated?.estimatedPoints ?? taskDraft.estimatedPoints ?? 0),`
);

write(frontendPath, frontend);

// ======================================================
// 2) Backend request DTO: make sure UpdateTaskRequest accepts estimatedPoints
// ======================================================
let req = read(requestPath);

if (!/estimatedPoints/.test(req)) {
  // Add field near other private fields.
  req = req.replace(
    /(private\s+[^;]+status[^;]*;\s*)/i,
    `$1
    private Integer estimatedPoints;
`
  );

  // Add getter/setter before final class closing brace.
  req = req.replace(
    /\n}\s*$/,
    `
    public Integer getEstimatedPoints() {
        return estimatedPoints;
    }

    public void setEstimatedPoints(Integer estimatedPoints) {
        this.estimatedPoints = estimatedPoints;
    }
}
`
  );
}

write(requestPath, req);

// ======================================================
// 3) Backend service: actually save estimatedPoints to TaskItem
// ======================================================
let service = read(servicePath);

if (!service.includes("setEstimatedPoints")) {
  console.error("Could not find any setEstimatedPoints usage. Adding it after dueDate update.");
}

if (!service.includes("task.setEstimatedPoints(req.getEstimatedPoints() == null ? 0 : req.getEstimatedPoints());")) {
  service = service.replace(
    /(task\.setDueDate\(req\.getDueDate\(\)\);\s*)/,
    `$1
        task.setEstimatedPoints(req.getEstimatedPoints() == null ? 0 : req.getEstimatedPoints());
        `
  );
}

// If there is already a simpler line, make it null-safe.
service = service.replace(
  /task\.setEstimatedPoints\(req\.getEstimatedPoints\(\)\);/g,
  `task.setEstimatedPoints(req.getEstimatedPoints() == null ? 0 : req.getEstimatedPoints());`
);

write(servicePath, service);

// ======================================================
// 4) DTO response: make sure frontend receives estimatedPoints back
// ======================================================
let dto = read(dtoPath);

if (!/estimatedPoints/.test(dto)) {
  // This is conservative. If TaskDto is constructor/record based, build may show exact place.
  dto = dto.replace(
    /(private\s+[^;]+status[^;]*;\s*)/i,
    `$1
    private Integer estimatedPoints;
`
  );

  dto = dto.replace(
    /\n}\s*$/,
    `
    public Integer getEstimatedPoints() {
        return estimatedPoints;
    }

    public void setEstimatedPoints(Integer estimatedPoints) {
        this.estimatedPoints = estimatedPoints;
    }
}
`
  );
}

write(dtoPath, dto);

console.log("Done. Now build frontend and compile backend.");
