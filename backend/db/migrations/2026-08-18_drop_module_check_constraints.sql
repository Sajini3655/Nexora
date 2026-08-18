-- Migration: drop stale CHECK constraints on the `module` columns
-- Date: 2026-08-18
-- Purpose: AccessModule was expanded from 5 to 14 values. The `module` columns
--          were created as enum columns, so they carry a check constraint that
--          only permits the original 5 values (DASHBOARD, TASKS, CHAT, FILES,
--          REPORTS). Inserting any of the new values (PROJECTS, TICKETS, USERS,
--          AI_*, etc.) fails until these constraints are removed.
--
-- Safety notes:
--   * DROP CONSTRAINT IF EXISTS is idempotent and safe to re-run.
--   * Removes a whitelist only; existing rows are untouched.
--   * ddl-auto=update will NOT re-add these on an existing column, so the
--     module columns simply accept the full 14-value set afterwards.

ALTER TABLE role_module_access DROP CONSTRAINT IF EXISTS role_module_access_module_check;

ALTER TABLE user_module_override DROP CONSTRAINT IF EXISTS user_module_override_module_check;
