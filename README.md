# Nexora — Smart Project Management System

Nexora is a smart project management system designed for software development teams. It helps teams manage users, projects, tasks, tickets, role-based dashboards, task-level chat, and AI-supported workflows through a shared web application.

The system supports multiple user roles such as Admin, Manager, Developer, and Client. After login, each user is redirected to the correct dashboard based on their role and permissions.

Nexora combines traditional project management features with intelligent AI-supported services such as email-to-ticket processing, ticket summarization, chat summarization, and future AI-assisted task assignment.

---

## Project Overview

Nexora improves software project management by combining centralized task tracking, ticket handling, role-based dashboards, real-time communication, and AI-powered assistance.

The project includes:

- Shared Spring Boot backend
- Shared Vite + React frontend
- JWT-based authentication
- Role-based login and dashboard routing
- Supabase PostgreSQL database connection
- Admin, Manager, Developer, and Client dashboards
- Project, task, and ticket management
- Task-level chat system
- WebSocket-based real-time messaging and dashboard update support
- AI service foundation for email-to-ticket processing and summarization
- Foundation for AI-assisted task assignment and blocker detection

---

## Main Features

### Authentication and Role-Based Access

- Single login page for all users
- JWT token-based authentication
- Token stored in browser localStorage
- Role-based redirection after login
- Protected routes based on user role
- Separate dashboard experience for Admin, Manager, Developer, and Client users

### Admin Dashboard

- Manage system users
- View system-level information
- Control user roles and access
- Monitor platform activity
- Support overall system administration

### Manager Dashboard

- View project and task progress
- Assign tasks to developers
- Assign tickets to developers
- Monitor developer workload
- Track task, project, and ticket activity
- View dashboard widgets for project progress and developer progress
- Manage task and ticket workflows

### Developer Dashboard

- View assigned tasks
- View assigned tickets
- Update task progress
- Track personal workload
- Access developer-specific dashboard pages
- Communicate through task-level chat where applicable

### Client Dashboard

- Submit tickets or support requests
- View submitted ticket details
- Track ticket status
- View project-related information based on permissions
- Communicate issues through the ticket flow

### Project Management

- Create and manage projects
- Track project progress
- Connect tasks and tickets to relevant projects
- Support manager-level project monitoring

### Task Management

- Create and manage tasks
- Assign tasks to developers
- Track task status
- Manage task progress using status updates
- Support story point or estimate-based progress tracking where implemented

### Ticket Management

- Create tickets manually
- View ticket details
- Assign tickets to developers
- Track ticket status
- Support ticket flow between Client, Manager, and Developer roles
- Support email-to-ticket processing foundation

### Task-Level Chat System

- Provides chat functionality for project/task-related communication
- Allows developers and managers to discuss task updates, blockers, and requirements
- Supports real-time communication using WebSocket/STOMP
- Keeps discussions connected to the correct task or project
- Supports chat message history
- Provides a foundation for AI-based chat summarization
- Provides a foundation for blocker detection from task discussions

### Real-Time Updates

- WebSocket support for live updates
- Dashboard update support
- Chat update support
- Helps users see changes without manually refreshing pages

### AI-Supported Features

Implemented or partially implemented AI-supported features include:

- Email-to-ticket processing foundation
- AI-based ticket summarization
- AI service integration using Python
- Groq API integration support
- Foundation for AI-based chat summarization
- Foundation for blocker detection from discussions

Planned AI enhancements include:

- AI-assisted task assignment
- Developer workload analysis
- Smart developer suggestions
- Advanced blocker detection
- AI-generated project summaries
- Predictive project risk detection

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript / JSX
- TypeScript / TSX in selected modules
- Material UI
- React Router
- WebSocket/STOMP client support
- Tailwind CSS where configured

### Backend

- Spring Boot
- Java
- Maven
- Spring Security
- JWT Authentication
- REST APIs
- WebSocket/STOMP support
- JPA / Hibernate

### Database

- Supabase PostgreSQL

### AI Service

- Python
- FastAPI / Uvicorn
- Groq API integration
- Email-to-ticket processing
- Ticket summarization
- AI service modules for future intelligent features

---

## Project Structure

```text
Nexora/
│
├── backend/
│   ├── src/
│   ├── pom.xml
│   ├── .env.example
│   └── ...
│
├── admin-manager/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js / vite.config.ts
│   └── ...
│
├── ai-service/
│   ├── main.py
│   ├── run.py
│   ├── summarizer.py
│   ├── email_worker.py
│   ├── requirements.txt
│   └── ...
│
└── README.md
