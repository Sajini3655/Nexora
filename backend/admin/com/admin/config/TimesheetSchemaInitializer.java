package com.admin.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TimesheetSchemaInitializer {

    private static final Logger log = LoggerFactory.getLogger(TimesheetSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void ensureTimesheetSchema() {
        try {
            jdbcTemplate.execute("""
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
                )
            """);

            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS developer_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS project_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS task_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS work_date DATE");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS hours NUMERIC(8,2)");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS description VARCHAR(4000)");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS work_location VARCHAR(32) DEFAULT 'WORK_FROM_HOME'");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'DRAFT'");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS reviewed_by_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(2000)");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE timesheet_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP");

            log.info("Timesheet schema verified successfully.");
        } catch (Exception ex) {
            log.warn("Timesheet schema initialization skipped or partially failed: {}", ex.getMessage());
        }
    }
}