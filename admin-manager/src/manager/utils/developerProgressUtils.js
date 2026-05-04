function normalizeStatus(task) {
  return String(task?.status || task?.taskStatus || task?.state || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

export function taskIsCompleted(task) {
  const status = normalizeStatus(task);

  if (["done", "completed", "complete", "closed", "resolved", "finished"].includes(status)) {
    return true;
  }

  const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
  const completedPointValue = Number(task?.completedPointValue ?? task?.completedStoryPoints ?? 0);

  return totalPointValue > 0 && completedPointValue >= totalPointValue;
}

export function isDelayedTask(task) {
  const due = task?.dueDate || task?.deadline || task?.targetDate || task?.plannedEndDate || task?.due_on;
  if (!due) return false;

  const dueDate = new Date(due);
  if (Number.isNaN(dueDate.getTime())) return false;

  return !taskIsCompleted(task) && dueDate.getTime() < Date.now();
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function getNestedId(value) {
  if (!value || typeof value !== "object") return undefined;

  return (
    value.id ??
    value.userId ??
    value.developerId ??
    value.assignedToId ??
    value.assigneeId ??
    value.assigned_to_id ??
    value.assignee_id
  );
}

function getTaskAssigneeId(task) {
  const id =
    task?.assignedToId ??
    task?.assigneeId ??
    task?.developerId ??
    task?.userId ??
    task?.assigned_to_id ??
    task?.assignee_id ??
    getNestedId(task?.assignedTo) ??
    getNestedId(task?.assignee) ??
    getNestedId(task?.assignedUser) ??
    getNestedId(task?.developer) ??
    getNestedId(task?.user);

  return id == null || id === "" ? "" : String(id);
}

function getTaskAssigneeName(task) {
  return (
    task?.assignedToName ||
    task?.assigneeName ||
    task?.developerName ||
    task?.assigned_to_name ||
    task?.assignedTo?.name ||
    task?.assignee?.name ||
    task?.assignedUser?.name ||
    task?.developer?.name ||
    task?.user?.name ||
    task?.assignedTo?.fullName ||
    task?.assignee?.fullName ||
    task?.assignedUser?.fullName ||
    ""
  );
}

export function buildSummariesFromTasks(developers, tasks) {
  const byId = new Map();
  const nameToId = new Map();

  (Array.isArray(developers) ? developers : []).forEach((developer) => {
    const id = String(developer?.id ?? developer?.userId ?? developer?.developerId ?? "");
    const name = developer?.name || developer?.fullName || developer?.email || "Developer";

    if (id) {
      byId.set(id, {
        developerId: id,
        developerName: name,
        assignedTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        totalPointValue: 0,
        completedPointValue: 0,
        averageProgress: 0,
      });

      nameToId.set(normalizeName(name), id);
    }
  });

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    let key = getTaskAssigneeId(task);

    if (!key) {
      const assigneeName = normalizeName(getTaskAssigneeName(task));
      key = nameToId.get(assigneeName) || "";
    }

    if (!key) return;

    if (!byId.has(key)) {
      byId.set(key, {
        developerId: key,
        developerName: getTaskAssigneeName(task) || "Developer",
        assignedTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        totalPointValue: 0,
        completedPointValue: 0,
        averageProgress: 0,
      });
    }

    const row = byId.get(key);
    const totalStoryPoints = numberOrZero(task?.totalStoryPoints ?? task?.totalPointValue ?? task?.estimatedPoints);
    const completedStoryPoints = numberOrZero(
      task?.completedStoryPoints ?? task?.completedPointValue ?? (taskIsCompleted(task) ? totalStoryPoints : 0)
    );
    const totalPointValue = numberOrZero(task?.totalPointValue ?? task?.estimatedPoints ?? totalStoryPoints);
    const completedPointValue = numberOrZero(
      task?.completedPointValue ?? completedStoryPoints ?? (taskIsCompleted(task) ? totalPointValue : 0)
    );

    row.assignedTasks += 1;
    row.completedTasks += taskIsCompleted(task) ? 1 : 0;
    row.inProgressTasks += taskIsCompleted(task) ? 0 : 1;
    row.totalStoryPoints += totalStoryPoints;
    row.completedStoryPoints += completedStoryPoints;
    row.totalPointValue += totalPointValue;
    row.completedPointValue += completedPointValue;
  });

  return Array.from(byId.values()).map((row) => ({
    ...row,
    averageProgress:
      row.totalPointValue > 0
        ? Math.round((row.completedPointValue * 100) / row.totalPointValue)
        : row.assignedTasks > 0
          ? Math.round((row.completedTasks * 100) / row.assignedTasks)
          : 0,
  }));
}

export function calculateDeveloperProgressTotals(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return safeRows.reduce(
    (totals, row) => ({
      assignedTasks: totals.assignedTasks + numberOrZero(row.assignedTasks),
      completedStoryPoints: totals.completedStoryPoints + numberOrZero(row.completedStoryPoints),
      totalStoryPoints: totals.totalStoryPoints + numberOrZero(row.totalStoryPoints),
      completedPointValue: totals.completedPointValue + numberOrZero(row.completedPointValue),
      totalPointValue: totals.totalPointValue + numberOrZero(row.totalPointValue),
    }),
    {
      assignedTasks: 0,
      completedStoryPoints: 0,
      totalStoryPoints: 0,
      completedPointValue: 0,
      totalPointValue: 0,
    }
  );
}
