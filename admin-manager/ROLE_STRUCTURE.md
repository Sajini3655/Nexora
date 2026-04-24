# Role File Structure

This frontend is organized by role-specific feature areas.

## Root Source
- src/admin: Admin-only pages and features
- src/manager: Manager-only pages and features
- src/dev: Developer-only pages, components, and local data mocks
- src/client: Client-only pages, components, and local data mocks
- src/components: Shared cross-role UI/layout components
- src/services: Shared API clients and service helpers
- src/context: Shared auth/layout contexts
- src/pages: Shared auth/common pages only

## Current Role Mapping

### Admin
- src/admin/pages/dashboard/AdminDashboard.jsx
- src/admin/pages/access/AccessControl.jsx
- src/admin/pages/profile/AdminProfile.jsx
- src/admin/pages/settings/AdminSettingsPage.jsx
- src/admin/pages/users/UserList.jsx
- src/admin/pages/users/InviteUserDialog.jsx

### Manager
- src/manager/pages/dashboard/ManagerDashboard.jsx
- src/manager/pages/ai/AIAssignment.jsx
- src/manager/pages/projects/AddProject.jsx
- src/manager/pages/projects/ProjectDetails.jsx
- src/manager/pages/projects/ProjectManagement.jsx
- src/manager/pages/projects/ProjectManagementDetails.jsx

### Developer
- src/dev/pages/dashboard/*
- src/dev/pages/workspace/*
- src/dev/pages/tasks/*
- src/dev/pages/tickets/*
- src/dev/pages/chat/*
- src/dev/pages/projects/*
- src/dev/pages/profile/*
- src/dev/pages/settings/*

### Client
- src/client/pages/dashboard/ClientDashboardHome.jsx
- src/client/pages/projects/ClientProjectList.jsx
- src/client/pages/tickets/ClientTicketList.jsx
- src/client/pages/profile/ClientProfile.jsx
- src/client/pages/settings/ClientSettings.jsx

## Conventions
- Put role-specific pages under that role folder.
- Put role-specific mock data/services under that role folder.
- Keep only shared/reusable code in src/components and src/services.
- Update route imports in src/App.jsx after creating/moving role pages.
