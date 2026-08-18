# Project & Task Deletion Testing Guide

## Overview
This guide tests the fixed deletion logic for projects and tasks. All deletions should now succeed regardless of the complexity of related records.

## Prerequisites
- Backend running on `localhost:8081`
- Manager authentication token
- API client (curl, Postman, or similar)

## Test Cases

### Test 1: Delete a Project with Complex Dependencies

**Setup**:
1. Create a project named "Test Project Complex"
2. Add multiple tasks to the project
3. Assign tasks to developers
4. Create timesheet entries for tasks
5. Create story points for tasks
6. Create tickets associated with project
7. Create chat sessions for project

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/projects/{projectId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response: `{"message": "Project deleted successfully."}`
- All related entities deleted from database
- No 400 Bad Request error

**Verification in Database**:
```sql
-- Verify project is deleted
SELECT * FROM projects WHERE id = {projectId};

-- Verify related entities are deleted
SELECT COUNT(*) FROM chat_sessions WHERE project_id = {projectId};
SELECT COUNT(*) FROM chat_messages WHERE id IN (SELECT id FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE project_id = {projectId}));
SELECT COUNT(*) FROM timesheet_entries WHERE project_id = {projectId};
SELECT COUNT(*) FROM tasks WHERE project_id = {projectId};
SELECT COUNT(*) FROM tickets WHERE project_id = {projectId};
```

---

### Test 2: Delete a Task with Complex Dependencies

**Setup**:
1. Create a project "Test Task Project"
2. Create a task "Complex Task"
3. Assign task to a developer
4. Create timesheet entries for this task
5. Create story points for this task
6. Create a ticket assigned to this task

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/tasks/{taskId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Result**:
- Status: 200 OK
- Response: `{"message": "Task deleted successfully."}`
- All related entities deleted from database
- No 400 Bad Request error

**Verification in Database**:
```sql
-- Verify task is deleted
SELECT * FROM tasks WHERE id = {taskId};

-- Verify related entities are deleted
SELECT COUNT(*) FROM timesheet_entries WHERE task_id = {taskId};
SELECT COUNT(*) FROM task_story_points WHERE task_id = {taskId};
SELECT COUNT(*) FROM tickets WHERE assigned_task_id = {taskId};
```

---

### Test 3: Delete Project with Assigned Users

**Setup**:
1. Create a project with assigned developers
2. Assign multiple tasks with multiple developers

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/projects/{projectId} \
  -H "Authorization: Bearer {token}"
```

**Expected Result**:
- Status: 200 OK
- Project deleted successfully despite having assigned users/developers

---

### Test 4: Delete Task with Assigned User

**Setup**:
1. Create a task that is assigned to a developer

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/tasks/{taskId} \
  -H "Authorization: Bearer {token}"
```

**Expected Result**:
- Status: 200 OK
- Task deleted successfully despite being assigned

---

### Test 5: Delete Project with Completed Tasks

**Setup**:
1. Create a project with tasks marked as COMPLETED/DONE

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/projects/{projectId} \
  -H "Authorization: Bearer {token}"
```

**Expected Result**:
- Status: 200 OK
- Project and completed tasks deleted successfully

---

### Test 6: Error Handling - Non-existent Project

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/projects/99999 \
  -H "Authorization: Bearer {token}"
```

**Expected Result**:
- Status: 404 Not Found
- Real error message: "Project not found"

---

### Test 7: Error Handling - Unauthorized Deletion

**Setup**:
1. Get project ID belonging to Manager A
2. Use Manager B's authentication token

**Execution**:
```bash
curl -X DELETE http://localhost:8081/api/manager/projects/{projectIdOwnedByManagerA} \
  -H "Authorization: Bearer {tokenOfManagerB}"
```

**Expected Result**:
- Status: 403 Forbidden
- Real error message: "You can only delete your own projects"

---

## Troubleshooting

### Issue: "Failed to delete project" with generic message

**Cause**: Exception not properly propagated from service layer

**Solution**: Check logs for actual error. The code now logs:
- Exact step where deletion failed
- Real exception message
- Stack trace

### Issue: Database constraint violation

**Cause**: Related entities not deleted in correct order

**Solution**: Deletion order is now:
1. Chat messages
2. Chat sessions  
3. Timesheet entries
4. Story points
5. Tickets
6. Tasks
7. Project files
8. Project itself

This order respects all foreign key constraints.

## Logging

The deletion process now logs detailed information:

```
[INFO] DELETE PROJECT request received: projectId=1
[INFO] DELETE PROJECT cleanup started: projectId=1, projectName=Test Project
[INFO] DELETE PROJECT Step 1: Deleting chat messages
[DEBUG] DELETE PROJECT Step 1 completed: Deleted messages for 2 chat sessions
[INFO] DELETE PROJECT Step 2: Deleting chat sessions
...
[INFO] DELETE PROJECT deleted successfully: projectId=1
```

Check application logs at: `backend/logs/` or application console

## Files Modified

- ✅ `backend/admin/com/admin/service/ProjectService.java`
- ✅ `backend/admin/com/admin/service/TaskAssignmentService.java`

## Build Verification

Run:
```bash
cd backend
mvn clean compile
```

Expected: BUILD SUCCESS with no errors
