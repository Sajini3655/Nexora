# Nexora Technical Presentation Documentation

## System Overview

Nexora is a role-based project-management platform. The browser client is a React 18/Vite SPA. The main API is a Spring Boot 3.2.12 application running on Java 21. PostgreSQL is accessed through Spring Data JPA/Hibernate, and a separate FastAPI service provides AI chat and chat summarization. Authentication uses JWT tokens and authorization is enforced by roles and service-level ownership checks.

Common request path:

```text
React component -> hook/service -> HTTP endpoint -> controller -> service -> repository/JPA -> PostgreSQL
                                                        |
                                                        -> LiveUpdatePublisher/WebSocket where applicable
```

Common security path:

```text
JWT in Authorization header -> Spring Security filter -> Authentication -> role/ownership check -> controller/service
```

---

# 1. Project Add Page

## 1. Module Name and File List

- **Module:** Project Add Page
- **Frontend:** [AddProject.jsx](admin-manager/src/manager/pages/projects/AddProject.jsx)
- **Shared services:** `admin-manager/src/services/managerService.js`, `admin-manager/src/services/api.js`
- **Shared state/data:** `admin-manager/src/manager/data/useManager.js`, `AuthContext.jsx`
- **Backend controller/service:** `backend/src/main/java/com/admin/controller/ProjectController.java`, `ProjectService.java`
- **Main DTOs/entities:** `CreateProjectRequest`, `ProjectResponse`, `Project`, `TaskItem`, `TaskStoryPoint`

## 2. Technology Stack

React 18, React Router, Material UI, TanStack React Query, Axios/fetch service helpers, Lucide icons, Vite, Spring Boot REST, Jakarta Validation, Spring Data JPA/Hibernate, PostgreSQL, JWT, and WebSocket live updates.

## 3. Purpose

This page creates a project and its initial task plan in one guided operation. It prevents a manager from creating an empty or invalid project and keeps project setup atomic from the user's perspective.

## 4. Workflow

1. The manager opens the page.
2. The component loads eligible clients with `fetchManagerClients`.
3. The manager enters project name and description.
4. The manager adds one or more tasks, priority, optional due date, and optional story points.
5. Client-side validation checks required fields, future dates, story-point titles, and point values.
6. The component builds a normalized payload and calls `createProject`.
7. `POST /api/manager/projects` reaches `ProjectController.createProject`.
8. `ProjectService` authenticates the manager, validates the selected client role, builds the project and tasks, and persists them transactionally.
9. The response is used to invalidate manager project queries and navigate back to project management.

Example payload shape:

```json
{
  "name": "Website Redesign",
  "description": "New customer-facing website",
  "clientId": 42,
  "tasks": [{
    "title": "Create wireframes",
    "description": "Prepare initial layouts",
    "priority": "HIGH",
    "dueDate": "2026-04-30",
    "storyPoints": [{"title": "Desktop layout", "pointValue": 3}]
  }]
}
```

## 5. Frontend and Backend Details

- State includes project fields, nested `tasks`, nested `storyPoints`, client list, loading, error, and success messages.
- `useMemo` calculates `canCreate` and the current local date. Handlers immutably update nested task and story-point arrays.
- MUI `TextField`, `MenuItem`, `Paper`, `Stack`, `Button`, and `Typography` provide the form UI.
- `ProjectController` exposes `POST /api/manager/projects`.
- `ProjectService.createProject` calls `getAuthenticatedManager`, checks that the selected user has `Role.CLIENT`, creates `Project` and `TaskItem` objects, and sets initial task status to `TODO`.
- Repositories persist projects, tasks, and story points. The project-to-task relationship is represented by the project foreign key.

## 6. Important Code Explanations

- Nested state is updated with `map` and `filter` so React receives new references and rerenders predictably.
- The page prevents removing the final task because a project must have an initial work item.
- Dates are checked before submission to catch user mistakes before network traffic.
- The backend repeats important validation and authorization because frontend validation cannot be trusted.
- `@Transactional` ensures that a project and its initial tasks are not partially saved.

## 7. Security and Database Relationships

JWT authentication identifies the manager. Backend authorization verifies the authenticated manager and verifies that the selected client actually has the client role. DTO validation protects the endpoint from malformed input. Project belongs to a manager and may belong to a client. Project has many tasks; tasks may have many story points. Users and roles are linked through the user-role join table.

## 8. Ten Presentation Questions and Answers

1. **Why create tasks with the project?** It gives the project an executable starting plan and avoids an empty project state.
2. **Why validate on both frontend and backend?** Frontend validation improves usability; backend validation protects the system from bypassed clients.
3. **Why use a DTO?** It limits the accepted fields and prevents exposing or binding entity internals directly.
4. **Why use a transaction?** Project and child task creation must succeed or fail together.
5. **Why check the client role?** A valid user ID is not enough; the business relationship requires a client.
6. **What is the initial task status?** `TODO`, because work has been planned but not started.
7. **How are story points represented?** As child records associated with a task, allowing detailed progress accounting.
8. **How is stale project data avoided?** React Query keys are invalidated after successful mutation.
9. **What happens if the API fails?** Loading ends and a user-facing error is displayed without pretending the project was created.
10. **How would you improve it?** Add server-driven field errors and an explicit draft/autosave option for very large project plans.

## 9. Presentation Notes

Introduce it as: “This is the manager's project bootstrap workflow. It captures the project, client, and initial backlog, validates the plan, and sends one transactional request to the backend.” Demonstrate adding a task, adding story points, submitting, and showing the resulting project in the management list.

---

# 2. Project Management

## 1. Module Name and File List

- **Module:** Project Management
- **Frontend:** [ProjectManagement.jsx](admin-manager/src/manager/pages/projects/ProjectManagement.jsx)
- **Data hooks:** `admin-manager/src/manager/data/useManager.js`
- **Service layer:** `admin-manager/src/services/managerService.js`
- **Backend:** `ProjectController.java`, `ProjectService.java`, `ProjectRepository.java`, `TaskRepository.java`

## 2. Technology Stack

React, React Router search parameters, TanStack React Query, Material UI dialogs/tables/chips/progress controls, Axios, Spring REST, JPA/Hibernate, PostgreSQL, JWT/RBAC, and live refresh support.

## 3. Purpose

This module gives managers an operational overview of projects. It combines project and task data, calculates progress, supports search and client assignment, and provides controlled deletion.

## 4. Workflow

1. `useManagerProjects` and `useManagerTasks` fetch manager-scoped data.
2. Clients are loaded with `fetchManagerClients`.
3. Tasks are grouped by project ID.
4. The page calculates task count, completed count, story-point totals, weighted progress, and status.
5. The query string `q` filters project name, description, and client name.
6. Create uses `POST /api/manager/projects`; delete confirms through a dialog and calls the project delete service.
7. On mutation success, query data is refreshed and the user sees a success message.

## 5. Frontend and Backend Details

The page uses `useMemo` for derived rows, `useEffect` for client loading, and dialog state for deletion. It normalizes alternate response property names such as `projectId`/`project_id` and status variants. MUI `Paper`, `Chip`, `LinearProgress`, `Dialog`, `TextField`, and `CircularProgress` display operational state.

The backend exposes `GET /api/manager/projects/mine`, `GET /api/manager/projects/{id}`, `POST /api/manager/projects`, `PUT /api/manager/projects/{projectId}`, and `DELETE /api/manager/projects/{id}`. The service enforces manager ownership and persists through project/task repositories.

## 6. Important Code Explanations

Weighted progress uses completed point value divided by total point value when estimates exist; otherwise it falls back to completed-task percentage. This is more accurate than treating a one-point task and a ten-point task as equal. The delete dialog reduces accidental destructive actions. Query-derived rows avoid duplicating backend data in local state.

## 7. Security and Database Relationships

Only authenticated managers should access manager-scoped endpoints. Ownership checks must occur in the service, not only in the UI. A project references its manager and optional client and owns task records. Deletion must respect child entities such as tasks, tickets, chats, files, and timesheets.

## 8. Ten Presentation Questions and Answers

1. **Why combine projects and tasks?** Progress is derived from actual work, not just project metadata.
2. **Why use weighted progress?** Story points represent relative effort.
3. **Why use React Query?** It handles server cache, loading, errors, and invalidation consistently.
4. **Why normalize response fields?** It makes the UI resilient to DTO naming differences during integration.
5. **What does search filter?** Project name, description, and client name.
6. **Why confirm deletion?** Deletion is destructive and may affect related records.
7. **Where is authorization enforced?** Spring Security and service-level ownership checks.
8. **What happens when no tasks exist?** The project is shown as `Planning` with zero progress.
9. **Why not trust client-side manager scope?** A browser can be manipulated; the server is authoritative.
10. **How does the dashboard stay current?** Query refresh and live update topics can trigger reloads.

## 9. Presentation Notes

Say: “This screen is the manager's control surface. It turns raw projects and tasks into searchable operational summaries, with progress calculated from delivery effort.”

---

# 3. Project Management Details

## 1. Module Name and File List

- **Module:** Project Management Details
- **Frontend:** [ProjectManagementDetails.jsx](admin-manager/src/manager/pages/projects/ProjectManagementDetails.jsx)
- **Related project view:** `admin-manager/src/manager/pages/projects/ProjectDetailsPage.jsx`
- **Services:** `managerService.js`, chat API under `admin-manager/src/dev/pages/chat/src/api.ts`
- **Backend:** `ProjectController.java`, `ProjectService.java`, `ProjectFileController.java`, `ProjectFileService.java`

## 2. Technology Stack

React hooks, React Router parameters, TanStack Query, Material UI dialogs/forms/progress controls, file upload APIs, chat components, Spring REST/JPA, PostgreSQL, JWT, and WebSocket refresh.

## 3. Purpose

This is the detailed workspace for editing a project after creation. It combines project metadata, task CRUD, assignee management, story points, attachments, progress, and project chat in one context.

## 4. Workflow

1. The route provides a project ID through `useParams`.
2. `useProjectDetails` loads project details; `useManagerDevelopers` loads assignee options.
3. The manager edits project data or opens task/file/chat dialogs.
4. Task creation/update/assignment calls the manager service functions.
5. File actions call upload, list, download, or delete endpoints.
6. Chat sessions/messages are loaded through the chat API and displayed in `ChatBox`.
7. `useLiveRefresh` and query invalidation keep the detailed workspace synchronized.

## 5. Frontend and Backend Details

State covers `emptyTaskForm`, `emptyStoryPointForm`, selected task, dialogs, file state, project form, chat sessions, errors, and loading. Helper functions normalize status, title, priority, assignee, estimate, and progress fields. MUI dialogs isolate editing workflows and `LinearProgress` shows completion.

Backend project endpoints are supported by `ProjectService`; file operations are handled by `ProjectFileController`/`ProjectFileService`. Task endpoints assign developers and update task state. Chat persistence uses session/message endpoints such as `/api/chat/project/{projectId}/sessions`, `/api/chat/messages`, and `/api/chat/end/{sessionId}`.

## 6. Important Code Explanations

The normalization helpers protect the UI from legacy or differently shaped DTO fields. `getTaskPointTotals` prefers point-value totals and falls back to story-point totals. Dates are checked before update. File downloads are explicit actions, avoiding accidental navigation to binary content. Dialog-local forms prevent partially edited values from immediately mutating the displayed project.

## 7. Security and Database Relationships

Project ownership and manager authorization are checked server-side. File download and deletion must verify project access. A project has tasks, files, chat sessions, tickets, and timesheet relationships. A task references its project, creator, and optional assignee. Chat sessions contain chat messages and are linked to the project and starter.

## 8. Ten Presentation Questions and Answers

1. **Why is this page more complex than the add page?** It handles multiple related resources and lifecycle operations.
2. **Why use dialogs?** They keep the user in project context while isolating focused edits.
3. **How are developers assigned?** The frontend selects a developer ID and the backend validates and persists the relationship.
4. **How is progress calculated?** Completed point value is compared with total point value, with task-status fallback.
5. **How are files protected?** The server must authorize project access for upload, download, and deletion.
6. **Why live refresh?** Another user may change a task or ticket while the manager is viewing the page.
7. **How does chat relate to a project?** Sessions and messages are persisted with project association.
8. **What prevents invalid due dates?** Local validation provides immediate feedback and backend validation remains authoritative.
9. **Why normalize status values?** It accommodates equivalent values such as `DONE`, `completed`, or `resolved`.
10. **What is the main design tradeoff?** Consolidation improves workflow speed but requires careful state and cache management.

## 9. Presentation Notes

Say: “After creation, this screen becomes the project's working room. The manager can maintain delivery data, collaborate through chat, attach evidence, and monitor progress without leaving the project.”

---

# 4. Task Management

## 1. Module Name and File List

- **Module:** Task Management
- **Frontend list:** [TaskList.jsx](admin-manager/src/pages/tasks/TaskList.jsx), [TaskView.jsx](admin-manager/src/pages/tasks/TaskView.jsx)
- **Developer task views:** `admin-manager/src/dev/pages/tasks/DevTaskList.jsx`
- **Manager data/services:** `admin-manager/src/manager/data/useManager.js`, `admin-manager/src/services/managerService.js`
- **Backend candidates:** `DeveloperTaskController.java`, task service/repository/entity classes under `backend/src/main/java/com/admin/`

## 2. Technology Stack

React, Material UI, shared UI components, React state/memoization, Spring REST/JPA, PostgreSQL, JWT/RBAC, and task progress calculations based on status and story points.

## 3. Purpose

Task management tracks assignable units of work, their assignees, status, priority, due date, and progress. It makes delivery measurable and gives managers and developers a common work queue.

## 4. Workflow

1. A task list loads or receives task data.
2. The user searches by title/assignee and filters by status.
3. Selecting a task opens details in a drawer or task view.
4. Managers create, assign, update, or delete tasks through manager services.
5. Developers use developer task endpoints to view assigned work and update progress/status.
6. The backend checks authentication, role, and project/task ownership before persistence.
7. Project summaries recalculate task and point progress.

## 5. Frontend and Backend Details

`TaskList.jsx` uses `useState` for query, selected task, and status filter, and `useMemo` for filtered rows. It uses shared `PageHeader`, `Card`, `Input`, and `Button` components. The currently shown list includes demo data and labels the editing area “backend later”; the production-connected manager/developer views use the manager and developer hooks/services.

The backend includes `/api/developer/tasks` for developer-scoped task operations. Manager task operations are exposed through manager service routes used by project details. Entities include `TaskItem` and `TaskStoryPoint`; repositories provide task and story-point persistence.

## 6. Important Code Explanations

Filtering is derived rather than copied into state, so changing the query always produces a consistent result. A drawer provides detail without losing list context. Status and priority are separate dimensions: status describes lifecycle, priority describes urgency.

## 7. Security and Database Relationships

A developer should only read or modify assigned tasks, while a manager can manage tasks in owned projects. Tasks reference projects, creators, assignees, and story points. Task records can also be referenced by timesheets and tickets, which affects deletion policies.

## 8. Ten Presentation Questions and Answers

1. **What is a task?** A bounded unit of project work with ownership and lifecycle state.
2. **Why separate status and priority?** Progress and urgency answer different business questions.
3. **Why filter client-side here?** The visible list is already loaded; server filtering is preferable for very large datasets.
4. **Who can update a task?** The assigned developer can update permitted fields; managers can manage their project tasks.
5. **How is progress connected to projects?** Task status and story-point completion roll up to project progress.
6. **Why use a drawer?** It supports rapid inspection while preserving list context.
7. **What is a security risk?** Accepting an arbitrary task ID without ownership checks.
8. **How is that prevented?** Service-layer authorization verifies the authenticated user's relationship.
9. **What does the demo data indicate?** The basic page is a UI scaffold; connected views supply live backend data.
10. **How would you scale filtering?** Add paginated server-side search and indexed status/project queries.

## 9. Presentation Notes

Say: “Tasks are the execution layer of Nexora. Projects express outcomes; tasks express the work required to reach them.” Be transparent that the basic `TaskList` scaffold contains demo rows while connected manager/developer task screens handle live workflows.

---

# 5. Admin Main Dashboard

## 1. Module Name and File List

- **Module:** Admin Main Dashboard
- **Frontend:** [AdminDashboard.jsx](admin-manager/src/admin/pages/dashboard/AdminDashboard.jsx)
- **API service:** `admin-manager/src/services/api.js`
- **Live refresh:** `admin-manager/src/hooks/useLiveRefresh.jsx`
- **Backend endpoints:** admin dashboard and system-health controllers/services under `backend/src/main/java/com/admin/`

## 2. Technology Stack

React hooks, MUI layout/table/dialog components, Lucide and MUI icons, Axios service calls, Promise-based parallel loading, Spring REST/Actuator, PostgreSQL health checks, JWT/RBAC, and STOMP/WebSocket topics.

## 3. Purpose

The dashboard gives administrators a high-level view of user roles, platform activity, and infrastructure health. It turns operational signals into a single monitoring screen.

## 4. Workflow

1. `useEffect` calls `loadDashboard` on mount.
2. `Promise.all` requests `getAdminDashboard()` and `getSystemHealth()` concurrently.
3. Stats, recent users, and health objects are stored in state.
4. Role cards show administrators, managers, developers, and clients.
5. Health cards show API, database, AI, email, and related status/details.
6. Health cards open a detail dialog for diagnosis/action text.
7. `useLiveRefresh` listens to `/topic/admin.dashboard`, `/topic/users`, `/topic/tickets`, `/topic/tasks`, and `/topic/system-health` and reloads with debounce.

## 5. Frontend and Backend Details

`useRef` prevents overlapping requests. `useMemo` builds role and health card models. Loading, error, retry, and detail-dialog states are explicit. The backend dashboard endpoint returns aggregate stats/recent users, while system health checks expose API/database/service status.

## 6. Important Code Explanations

Parallel requests reduce initial wait time. The fetch guard prevents a burst of WebSocket events from creating concurrent duplicate requests. A debounced refresh avoids hammering the backend while still making changes visible quickly.

## 7. Security and Database Relationships

The dashboard is administrator-only and must not expose health details to ordinary users. Stats aggregate users, projects, tasks, and tickets; recent users come from the user table. Health data is operational metadata and should avoid including secrets or credentials.

## 8. Ten Presentation Questions and Answers

1. **Why use Promise.all?** Dashboard and health data are independent and can load concurrently.
2. **Why use a request guard?** It prevents duplicate in-flight loads.
3. **What does live refresh solve?** It reduces stale operational information.
4. **Why debounce events?** Several related changes may publish together.
5. **What belongs on an admin dashboard?** Aggregate indicators and actionable health signals.
6. **Why open health details in a dialog?** The overview remains compact while diagnostics stay available.
7. **Who can access it?** Authenticated administrators under RBAC.
8. **What should never be displayed?** Passwords, JWT secrets, database credentials, or raw sensitive logs.
9. **What does database latency mean?** The measured response time of the health query, not overall application performance.
10. **How would you improve it?** Add historical charts, alert thresholds, and server-side audit links.

## 9. Presentation Notes

Say: “The administrator dashboard is both a business overview and an operational health console. It answers who is using the system and whether the system is functioning.”

---

# 6. User Registration

## 1. Module Name and File List

- **Module:** Invite-Based User Registration
- **Frontend:** [Register.jsx](admin-manager/src/pages/auth/Register.jsx)
- **Backend controller:** [AuthController.java](backend/src/main/java/com/admin/controller/AuthController.java)
- **Backend service:** `backend/src/main/java/com/admin/service/AuthService.java`
- **DTOs:** `AcceptInviteRequest`, `InviteLookupResponse`, `AuthResponse`, `RegisterRequest`

## 2. Technology Stack

React, Axios, URLSearchParams, CSS variables, Spring Boot REST, Jakarta Validation, Spring Security, JWT, password hashing through the authentication service, PostgreSQL, and audit logging.

## 3. Purpose

Registration is invite-based. An administrator or manager creates an invitation; the recipient verifies the token and sets a password. This prevents open self-registration and preserves the role selected by the inviter.

## 4. Workflow

1. The page reads `token` from the URL.
2. `GET /api/auth/accept-invite?token=...` validates the invite and returns email, name, and role.
3. The page displays invite information and asks for password and confirmation.
4. Client validation checks token presence, minimum six-character password, and equality.
5. `POST /api/auth/accept-invite` sends token and password.
6. `AuthService.acceptInvite` activates the account and consumes/updates the invite.
7. `AuditLogService` records invite acceptance.
8. The user is redirected to login after success.

## 5. Frontend and Backend Details

The page has loading, submitting, success, error, email, name, role, password, and confirmation state. Axios response errors are mapped to readable messages. `AuthController` also exposes `/register`, `/login`, `/me`, and `/change-password`, while the page specifically uses the accept-invite flow.

## 6. Important Code Explanations

The token is read once with `useMemo` and used as the identity of the invitation. The password is never prefilled or sent during the lookup request. Redirect after success prevents repeated submissions and moves the user into the normal authentication flow.

## 7. Security and Database Relationships

Invite tokens should be random, expiring, single-use values stored server-side. Passwords must be hashed, never stored in plain text. Authentication returns JWTs; role membership is associated with the user through roles. Audit logs record registration events without logging passwords or tokens.

## 8. Ten Presentation Questions and Answers

1. **Why invite-only registration?** It prevents unauthorized account creation.
2. **What does the lookup request do?** It validates the token and safely retrieves non-secret invite metadata.
3. **Why validate password confirmation?** It catches entry mistakes before submission.
4. **Is six characters sufficient security?** It is a minimum usability rule; production policy should also consider length and breach resistance.
5. **Who assigns the role?** The invitation workflow, controlled by authorized staff.
6. **Why audit acceptance?** It provides accountability for account activation.
7. **Should the token appear in logs?** No, because it can grant account activation.
8. **What happens with an expired token?** The backend rejects it and the UI displays the error.
9. **Why does the page redirect to login?** Account activation and authentication are separate lifecycle steps.
10. **How are unauthorized requests blocked?** Spring Security and service validation enforce the backend contract.

## 9. Presentation Notes

Say: “Registration is not open signup. It is a controlled activation process where the invite establishes identity and role, and the recipient supplies only the password needed to activate the account.”

---

# 7. AI Chatbot

## 1. Module Name and File List

- **Module:** AI Developer Chatbot
- **Frontend shell:** [DevChat.jsx](admin-manager/src/dev/pages/chat/DevChat.jsx)
- **Chat UI:** `admin-manager/src/dev/pages/chat/src/ChatBox.tsx`, `App.tsx`, `SummaryModal.tsx`
- **Chat API:** `admin-manager/src/dev/pages/chat/src/api.ts`
- **AI service:** [main.py](ai-service/main.py), [summarizer.py](ai-service/summarizer.py)
- **Persistence:** backend chat controller/service/repositories under `backend/src/main/java/com/admin/`

## 2. Technology Stack

React/TypeScript, MUI, React Query mutations, Fetch API, FastAPI, Uvicorn, Python, Groq SDK, environment-based model selection, JWT forwarding, and PostgreSQL-backed chat sessions/messages.

## 3. Purpose

The chatbot gives developers an assistant inside project context. It supports practical questions, preserves project conversations, and provides a path from conversation to summary and action.

## 4. Workflow

1. `DevChat` resolves a project ID from the route or assigned tasks.
2. The authenticated user and project readiness are checked.
3. A chat session is created or loaded through `/api/chat/...` endpoints.
4. Messages are persisted through the backend.
5. For an AI reply, the frontend sends the conversation to `POST {AI_URL}/chat/message`.
6. FastAPI calls Groq with a system prompt when configured; otherwise `summarizer.py` returns a local fallback response.
7. The response is returned as `{ text: ... }` and displayed in `ChatBox`.
8. Ending chat calls `POST {AI_URL}/chat/end` for structured summary/blocker detection.

## 5. Frontend and Backend Details

The frontend manages project resolution, authentication readiness, loading/error state, summary state, ticket creation state, and ticket choice. `api.ts` attaches the JWT from local storage. The Python service accepts full message history, builds an AI input transcript, and streams chunks from Groq internally before returning the assembled response.

## 6. Important Code Explanations

The AI service is deliberately isolated from the core Java API so model failures do not stop project management. The system prompt asks for concise actionable responses. The local fallback keeps the feature usable when the SDK or API key is absent. Full history is sent so the assistant can understand context rather than answering only the latest sentence.

## 7. Security and Database Relationships

The browser forwards JWTs to protected Java chat endpoints. AI prompts must not include passwords, tokens, or unnecessary personal data. Project access is checked before loading sessions/messages. Chat sessions belong to projects and users; messages belong to sessions. The AI service should be deployed with restricted CORS and secrets in environment variables rather than source code.

## 8. Ten Presentation Questions and Answers

1. **Why separate FastAPI from Spring Boot?** AI workloads and model dependencies are isolated from transactional business APIs.
2. **Why send conversation history?** Context improves relevance and blocker detection.
3. **What happens without Groq access?** A deterministic local fallback response is returned.
4. **How is the model selected?** A valid model is discovered and can be overridden by `GROQ_MODEL`.
5. **How is authentication passed?** The frontend adds a Bearer JWT to backend and AI requests.
6. **Should the AI trust user text as instructions?** No; system prompts and input boundaries should resist prompt injection.
7. **Where are messages stored?** In backend chat session/message persistence.
8. **What is the main failure mode?** Model/network failure, handled by fallback and frontend error state.
9. **How can responses be made safer?** Add data minimization, moderation, rate limits, and output schema validation.
10. **What makes this project-aware?** The chat is resolved against a project and its assigned tasks.

## 9. Presentation Notes

Say: “The chatbot is an assistive layer, not the system of record. Nexora keeps project data and permissions in the Java backend while the Python service supplies conversational intelligence.”

---

# 8. Chat Summarization

## 1. Module Name and File List

- **Module:** AI Chat Summarization and Blocker Detection
- **Frontend:** `ChatBox.tsx`, `SummaryModal.tsx`, `DevChat.jsx`
- **AI client:** [api.ts](admin-manager/src/dev/pages/chat/src/api.ts)
- **AI implementation:** [main.py](ai-service/main.py), [summarizer.py](ai-service/summarizer.py)
- **Persistence:** backend `/api/chat/end/{sessionId}` and chat service/repositories

## 2. Technology Stack

FastAPI, Python, Groq structured JSON responses, deterministic keyword fallback, React/TypeScript, Fetch API, Spring persistence, PostgreSQL, and ticket REST integration.

## 3. Purpose

The feature converts an ended conversation into a concise summary, identifies blockers, and determines whether a ticket should be offered. It turns unstructured chat into a reviewable project artifact.

## 4. Workflow

1. The user ends a chat.
2. `endChatAI(messages, projectId, createTickets)` calls `/chat/end`.
3. `build_ai_summary` converts messages into `Manager/Developer` and `Assistant` transcript lines.
4. Groq is asked for strict JSON: summary, blockers, ticket flag, and ticket message.
5. If Groq is unavailable or returns invalid data, `extract_blockers` and fallback text produce a usable result.
6. The frontend displays the result in the summary modal.
7. The summary can be saved to the Java backend with `POST /api/chat/end/{sessionId}`.
8. If blockers exist, the user may create a high-priority ticket.

## 5. AI Architecture and Prompt Handling

The prompt explicitly specifies the JSON schema and instructs the model to set `ticket_prompt_needed` only when a blocker should become a ticket. Temperature is low (`0.2`) to improve repeatability. The deterministic detector recognizes database outages, missing API keys, AI outages, generic service outages, and critical/blocking language. The fallback is important because AI output is non-deterministic and external connectivity can fail.

## 6. Important Code Explanations

`extract_blockers` lowercases and combines message content, then checks known phrases. `build_ai_summary` separates model-based summarization from fallback behavior. `create_tickets` is passed explicitly so ticket creation is a user-controlled action rather than an automatic side effect of every summary.

## 7. Security and Database Relationships

Only authorized project members should summarize or save a session. Summaries may contain sensitive project information, so access control must match chat access. Store summary text with the chat session and preserve project association. Never include JWTs or credentials in prompts. Validate the returned JSON before rendering or persisting it.

## 8. Ten Presentation Questions and Answers

1. **Why require JSON?** Structured output lets the frontend reliably consume summary fields.
2. **Why have keyword fallback?** Availability should not depend entirely on an external model.
3. **What blockers are detected?** Database/API/AI outages and explicit critical or blocking language.
4. **Why low temperature?** Summaries should be consistent and concise.
5. **Does the AI automatically create tickets?** No; the user confirms ticket creation.
6. **Where is the summary stored?** The Java backend stores it against the chat session.
7. **What if JSON parsing fails?** The exception path generates a local summary/blocker result.
8. **Why save after AI generation?** AI analysis and durable project history are separate responsibilities.
9. **What is a limitation?** Phrase matching can miss implied blockers or create false positives.
10. **How would you improve it?** Add schema validation, confidence scores, configurable rules, and evaluation datasets.

## 9. Presentation Notes

Say: “Summarization is the bridge between conversation and management action. It produces a compact record, highlights risk, and asks for human confirmation before creating a ticket.”

---

# 9. Ticket Creation

## 1. Module Name and File List

- **Module:** Ticket Creation and Tracking
- **Chat ticket client:** `admin-manager/src/dev/pages/chat/src/api.ts`
- **Chat trigger:** [DevChat.jsx](admin-manager/src/dev/pages/chat/DevChat.jsx)
- **Ticket display:** [TicketWidget.jsx](admin-manager/src/dev/components/tickets/TicketWidget.jsx)
- **Other views:** `admin-manager/src/manager/pages/tickets/ManagerTickets.jsx`, `admin-manager/src/client/pages/tickets/ClientTicketList.jsx`
- **Backend:** [TicketController.java](backend/src/main/java/com/admin/controller/TicketController.java), `TicketService.java`, `TicketRepository.java`, `Ticket` entity

## 2. Technology Stack

React, MUI, Tailwind utility classes, React Router links, Fetch/Axios, Spring REST/JPA, PostgreSQL, JWT/RBAC, and live refresh events.

## 3. Purpose

Tickets record issues that need ownership and follow-up. Nexora supports direct creation and creation from a chat summary, retaining source metadata so teams can understand where an issue originated.

## 4. Workflow

1. A user reports or identifies an issue.
2. In the AI path, `DevChat` verifies that the summary contains blockers.
3. `createProjectTicket` sends `POST /api/tickets` with title, description, project, status `OPEN`, priority `HIGH`, and `sourceChannel: CHAT_SUMMARY`.
4. `TicketController` validates the request and delegates to `TicketService`.
5. The service authorizes the user, resolves project/client relationships, and saves the ticket.
6. The ticket appears in manager/client/developer views, where filters use status and search text.
7. `TicketWidget` counts Open, In Progress, and Done tickets and links each ticket to its details route.

Example generated ticket:

```json
{
  "title": "Chat blocker: Database server is down",
  "status": "OPEN",
  "priority": "HIGH",
  "sourceChannel": "CHAT_SUMMARY",
  "project": {"id": 12}
}
```

## 5. Frontend and Backend Details

`TicketWidget` uses `useState` for status filter, search query, and show-all state, and `useMemo` for counts and filtered results. It labels origins such as `BACKEND`, `EMAIL`, `DIRECT_MESSAGE`, and `CHAT_SUMMARY`. The ticket API uses JWT headers and checks HTTP status before returning JSON.

`TicketController` owns the `/api/tickets` REST boundary; `TicketService` owns business rules and repository access. The ticket entity can reference project, creator, assignee/manager/client relationships depending on the workflow.

## 6. Important Code Explanations

The source channel is valuable audit metadata. The generated description includes the blocker and project ID, making the ticket understandable outside the chat. The frontend prevents ticket creation when there is no blocker and lets the developer explicitly skip it. Status counts give managers a compact workload view.

## 7. Security and Database Relationships

Ticket creation requires authentication and must enforce project membership or permitted role. Users may create, view, or manage different ticket fields depending on RBAC. Tickets reference their project and users involved in creation/assignment. Deletion and user deactivation must account for every ticket foreign-key reference.

## 8. Ten Presentation Questions and Answers

1. **Why create a ticket from chat?** It converts an identified blocker into an owned work item.
2. **Why require human confirmation?** AI detection is assistive and can be wrong.
3. **Why set chat-derived tickets to high priority?** A detected blocker is presumed urgent, but managers can reclassify it.
4. **What is source metadata?** A field explaining whether the ticket came from chat, email, backend, or direct message.
5. **Who can see a ticket?** Users authorized by project and role relationships.
6. **Why use a project reference?** It keeps the issue connected to delivery context.
7. **How does the widget filter?** It filters by status and searchable ticket text locally.
8. **What if ticket creation fails?** The error is displayed and the summary remains available for retry or manual action.
9. **How are lifecycle states represented?** Open, In Progress, and Done are presented as user-facing statuses.
10. **How would you improve it?** Add duplicate detection, assignment rules, SLA dates, and optimistic updates with rollback.

## 9. Presentation Notes

Say: “A ticket is Nexora's durable action record. The important design point is traceability: a ticket can preserve the blocker, project, priority, and source channel that caused it to exist.”

---

# Cross-Module Defense Notes

## End-to-End Example

A manager creates a project with tasks and a client. A developer is assigned a task and discusses a database outage in project chat. The AI service summarizes the conversation and detects `Database server is down`. The developer confirms ticket creation. The frontend posts a high-priority `CHAT_SUMMARY` ticket to the Spring API. The ticket is linked to the project, shown in manager/client views, and contributes to dashboard activity. Live update topics refresh affected screens.

## Why This Architecture

- **React frontend:** responsive role-specific workflows and reusable components.
- **Spring Boot backend:** centralized security, validation, transactions, business rules, and persistence.
- **JPA/Hibernate:** maps projects, tasks, users, chats, files, tickets, and timesheets to relational tables.
- **FastAPI AI service:** isolates model SDKs, prompts, streaming, and fallback logic.
- **JWT/RBAC:** ensures the browser's role is not the final authority; the backend decides access.
- **PostgreSQL:** preserves relationships and transactional consistency.

## Strong Closing Statement

“Nexora connects planning, execution, communication, intelligence, and issue management. The main engineering principle is separation of responsibilities: React manages interaction, Spring manages protected business operations, PostgreSQL preserves relationships, and the AI service augments decisions without becoming the source of truth.”
