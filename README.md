# Nexora

**Nexora** is a Smart Project Management System built for software teams.  
It provides one shared frontend and one shared backend for managing users, projects, tasks, tickets, and role-based dashboards.

The system supports multiple user roles such as **Admin**, **Manager**, and **Developer** through a single login page. After login, users are redirected to the correct dashboard based on their role.

---

## Project Overview

Nexora is designed to improve project management by combining traditional task tracking with intelligent and role-based workflows.

The project currently includes:

- One shared **Spring Boot backend**
- One shared **Vite + React frontend**
- Role-based login and dashboard routing
- JWT-based authentication
- Supabase PostgreSQL database connection
- Admin, Manager, and Developer dashboard routes
- Developer login redirection to the Developer dashboard
- Foundation for future AI-powered task assignment

---

## Main Features

### Authentication and Role-Based Access

- Shared login page for all users
- JWT token stored in `localStorage.token`
- Role-based redirection after login
- Separate dashboards for Admin, Manager, and Developer users

### Admin Dashboard

- Manage users
- View system-level information
- Control user roles and access

### Manager Dashboard

- View project and task progress
- Assign tasks to developers
- Monitor developer workload
- Track task and ticket activity

### Developer Dashboard

- View assigned tasks
- Update task progress
- Work inside the same shared frontend
- Accessible through `/dev`

### Future AI Features

Planned AI-powered features include:

- AI-assisted task assignment
- Developer workload analysis
- Smart developer suggestions
- Blocker detection
- AI-generated summaries
- Email-to-ticket automation

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- Material UI / UI components
- React Router

### Backend

- Spring Boot
- Java
- Maven
- Spring Security
- JWT Authentication
- REST APIs

### Database

- Supabase PostgreSQL

### Future / Planned Services

- Python AI services
- AI task assignment
- Email-to-ticket processing
- Real-time updates with WebSockets

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
│   ├── vite.config.js
│   └── ...
│
└── README.md
