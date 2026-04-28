-- Remove orphan developer profile rows before Hibernate applies FK constraints.
-- 1) Delete dependent skill rows referencing orphan profiles.
DELETE FROM developer_skills ds
WHERE EXISTS (
  SELECT 1
  FROM developer_profiles dp
  WHERE dp.id = ds.profile_id
    AND NOT EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = dp.user_id
    )
);

-- 2) Delete orphan profiles that reference missing users.
DELETE FROM developer_profiles dp
WHERE NOT EXISTS (
  SELECT 1
  FROM users u
  WHERE u.id = dp.user_id
);

-- Timesheet schema bootstrap for existing Supabase databases.
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id BIGSERIAL PRIMARY KEY,
  developer_id BIGINT,
  project_id BIGINT,
  task_id BIGINT,
  work_date DATE,
  hours NUMERIC(8,2),
  description VARCHAR(4000),
  work_location VARCHAR(32) DEFAULT 'WORK_FROM_HOME',
  status VARCHAR(16) DEFAULT 'DRAFT',
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by_id BIGINT,
  rejection_reason VARCHAR(2000),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS developer_id BIGINT;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS project_id BIGINT;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS task_id BIGINT;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS work_date DATE;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS hours NUMERIC(8,2);
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS description VARCHAR(4000);
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS work_location VARCHAR(32) DEFAULT 'WORK_FROM_HOME';
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'DRAFT';
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS reviewed_by_id BIGINT;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(2000);
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
