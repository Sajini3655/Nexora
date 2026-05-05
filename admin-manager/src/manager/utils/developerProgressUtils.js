export function taskIsCompleted(task) {
  const status = String(task?.status || task?.taskStatus || task?.state || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  if (["done", "completed", "complete", "closed", "resolved", "finished"].includes(status)) {
    return true;
  }

  const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
  const completedPointValue = Number(task?.completedPointValue ?? task?.completedStoryPoints ?? 0);

  return totalPointValue > 0 && completedPointValue >= totalPointValue;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function buildSummariesFromTasks(developers, tasks) {
  const byId = new Map();
  const developerNameToId = new Map();

  const normalizeName = (value) => String(value || "").trim().toLowerCase();

  const getTaskAssigneeName = (task) =>
    task?.assignedToName ||
    task?.assigneeName ||
    task?.assigned_to_name ||
    task?.assignedTo?.name ||
    task?.assignee?.name ||
    task?.assignedUser?.name ||
    task?.assignedTo?.fullName ||
    task?.assignee?.fullName ||
    task?.assignedUser?.fullName ||
    "";

  const getNestedAssigneeId = (value) => {
    if (!value || typeof value !== "object") return undefined;

    return (
      value.id ??
      value.userId ??
      value.developerId ??
      value.assignedToId ??
      value.assigned_to_id ??
      value.assigneeId ??
      value.assignee_id ??
      undefined
    );
  };

  const findAssigneeField = (task) => {
    if (!task || typeof task !== "object") return undefined;

    const assigneeIdKey = Object.keys(task).find((key) =>
      /(?:assigned|assignee|developer|user).*(?:id|_id)$/i.test(key)
    );

    return assigneeIdKey ? task[assigneeIdKey] : undefined;
  };

  const getTaskAssigneeId = (task) => {
    const candidate =
      task?.assignedToId ??
      task?.assigneeId ??
      task?.assigned_to_id ??
      getNestedAssigneeId(task?.assignedTo) ??
      getNestedAssigneeId(task?.assignee) ??
      getNestedAssigneeId(task?.assignedUser) ??
      getNestedAssigneeId(task?.assigned) ??
      getNestedAssigneeId(task?.developer) ??
      getNestedAssigneeId(task?.user) ??
      findAssigneeField(task);

    return candidate == null || candidate === "" ? "" : String(candidate);
  };

  (Array.isArray(developers) ? developers : []).forEach((developer) => {
    const key = String(developer?.id ?? "");
    const devName = developer?.name || "Developer";
    const normalizedName = normalizeName(devName);

    if (normalizedName && key) {
      developerNameToId.set(normalizedName, key);
    }

    if (!key) return;

    byId.set(key, {
      developerId: developer.id,
      developerName: devName,
      assignedTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      totalPointValue: 0,
      completedPointValue: 0,
      averageProgress: 0,
    });
  });

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    let key = getTaskAssigneeId(task);

    if (!key) {
      const assigneeName = normalizeName(getTaskAssigneeName(task));
      if (assigneeName && developerNameToId.has(assigneeName)) {
        key = developerNameToId.get(assigneeName);
      }
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

    const summary = byId.get(key);

    const totalStoryPoints = numberOrZero(task?.totalStoryPoints ?? task?.totalPointValue ?? task?.estimatedPoints);
    const completedStoryPoints = numberOrZero(
      task?.completedStoryPoints ?? task?.completedPointValue ?? (taskIsCompleted(task) ? totalStoryPoints : 0)
    );

    const totalPointValue = numberOrZero(task?.totalPointValue ?? task?.estimatedPoints ?? totalStoryPoints);
    const completedPointValue = numberOrZero(
      task?.completedPointValue ?? completedStoryPoints ?? (taskIsCompleted(task) ? totalPointValue : 0)
    );

    summary.assignedTasks += 1;
    summary.completedTasks += taskIsCompleted(task) ? 1 : 0;
    summary.inProgressTasks += taskIsCompleted(task) ? 0 : 1;
    summary.totalStoryPoints += totalStoryPoints;
    summary.completedStoryPoints += completedStoryPoints;
    summary.totalPointValue += totalPointValue;
    summary.completedPointValue += completedPointValue;
  });

  return Array.from(byId.values())
    .filter((summary) => summary.assignedTasks > 0)
    .map((summary) => ({
      ...summary,
      averageProgress:
        summary.totalPointValue > 0
          ? Math.round((summary.completedPointValue * 100) / summary.totalPointValue)
          : summary.assignedTasks > 0
            ? Math.round((summary.completedTasks * 100) / summary.assignedTasks)
            : 0,
    }));
}

export function calculateDeveloperProgressTotals(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return {
    assignedTasks: safeRows.reduce((sum, row) => sum + Number(row.assignedTasks || 0), 0),
    completedStoryPoints: safeRows.reduce((sum, row) => sum + Number(row.completedStoryPoints || 0), 0),
    totalStoryPoints: safeRows.reduce((sum, row) => sum + Number(row.totalStoryPoints || 0), 0),
    completedPointValue: safeRows.reduce((sum, row) => sum + Number(row.completedPointValue || 0), 0),
    totalPointValue: safeRows.reduce((sum, row) => sum + Number(row.totalPointValue || 0), 0),
  };
}
