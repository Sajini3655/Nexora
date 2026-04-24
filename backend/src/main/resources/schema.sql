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
