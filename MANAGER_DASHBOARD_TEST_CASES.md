# Manager Dashboard Test Cases

Open the manager workspace at `/manager` after signing in as a manager.

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| MD-01 | Dashboard loads | Sign in as Manager and open Manager Dashboard | Dashboard title, summary cards, projects, tasks, developers, and ticket sections render without an error alert. |
| MD-02 | Empty project data | Use a manager with no projects | The dashboard remains usable and shows an empty-state message instead of crashing. |
| MD-03 | Project summary | Open the dashboard with assigned projects | Project names, client information, status/progress, and project counts match the manager's data. |
| MD-04 | Project navigation | Click a project card or project action | The app navigates to the correct project details or project-management page. |
| MD-05 | Task summary | Open the task section | Task title, project, assignee, status, priority, and progress values are displayed. |
| MD-06 | Ticket visibility | Open the recent ticket section | Open or active tickets are shown; closed tickets are not incorrectly presented as active. |
| MD-07 | Ticket navigation | Click a ticket or ticket action | The app navigates to Manager Tickets with the correct ticket context. |
| MD-08 | Developer progress | Open developer progress | Developer names and assigned-task progress render correctly. |
| MD-09 | Loading state | Refresh the page with network throttling enabled | Loading indicators appear, then the dashboard renders after requests complete. |
| MD-10 | API failure | Temporarily stop the backend, then refresh | A readable error state appears and the page does not crash or render broken controls. |
| MD-11 | Live refresh | Keep the dashboard open and trigger a manager data update | The dashboard refreshes or shows the updated data without a full-page reload. |
| MD-12 | NLQ navigation | Type `dashboard` in the NLQ bar and press Enter | The user remains on `/manager` and no error snackbar appears. |
| MD-13 | Keyboard navigation | Use Tab through the dashboard outside popups | Focus reaches the NLQ navigation input according to the global keyboard behavior. |
| MD-14 | Responsive layout | Check desktop width and a narrow mobile width | Cards, controls, headings, and sections remain readable without overlapping or horizontal clipping. |
| MD-15 | Access control | Sign in as a developer or client and open `/manager` directly | Access is denied or redirected according to the application's route protection. |

## Quick Evaluation Flow

1. Sign in as a manager.
2. Open `/manager`.
3. Confirm the summary cards and project/task data.
4. Click one project and one ticket to verify navigation.
5. Use the NLQ bar with `dashboard` and a known project name.
6. Refresh once and confirm loading/error states remain clean.
7. Repeat at a narrow browser width.
