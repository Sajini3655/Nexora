-- Migration: remove the FILES and REPORTS access modules
-- Date: 2026-08-18
-- Purpose: FILES and REPORTS are removed from the business requirements. The
--          AccessModule enum no longer contains them, so any leftover rows with
--          module = 'FILES' or 'REPORTS' can no longer be mapped by JPA and must
--          be deleted. (The Projects feature, previously gated by FILES, now uses
--          the PROJECTS module.)
--
-- Safety notes:
--   * Deletes only rows for the two removed modules; all other rows are untouched.
--   * Safe to re-run (a no-op once the rows are gone).

DELETE FROM role_module_access WHERE module IN ('FILES', 'REPORTS');

DELETE FROM user_module_override WHERE module IN ('FILES', 'REPORTS');
