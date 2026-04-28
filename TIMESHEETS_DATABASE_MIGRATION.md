# Timesheets Database Migration Guide

## SQL Migration Script

Create a new migration file in your database migrations folder. This script creates the `timesheet_entries` table:

```sql
-- Migration: Create Timesheets Table
-- Date: 2026-04-28

CREATE TABLE timesheet_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    task_id BIGINT,
    work_date DATE NOT NULL,
    hours_worked DOUBLE NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    approved_by_id BIGINT,
    approved_at DATETIME,
    rejection_reason VARCHAR(1000),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_timesheet_developer FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_timesheet_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_timesheet_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_timesheet_approver FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_developer (user_id),
    INDEX idx_project (project_id),
    INDEX idx_task (task_id),
    INDEX idx_status (status),
    INDEX idx_work_date (work_date),
    INDEX idx_created_at (created_at),
    INDEX idx_developer_date (user_id, work_date),
    INDEX idx_project_date (project_id, work_date)
);

-- Add validation checks
ALTER TABLE timesheet_entries
ADD CONSTRAINT chk_hours_positive CHECK (hours_worked > 0);

-- Grant permissions if using user-based access
-- GRANT SELECT, INSERT, UPDATE, DELETE ON timesheets.timesheet_entries TO 'app_user'@'localhost';
```

## Liquibase Migration (Alternative)

If using Liquibase, create `changesets/create-timesheet-table.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                   http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

    <changeSet id="1" author="admin">
        <createTable tableName="timesheet_entries">
            <column name="id" type="BIGINT" autoIncrement="true">
                <constraints primaryKey="true"/>
            </column>
            <column name="user_id" type="BIGINT">
                <constraints nullable="false"/>
            </column>
            <column name="project_id" type="BIGINT">
                <constraints nullable="false"/>
            </column>
            <column name="task_id" type="BIGINT"/>
            <column name="work_date" type="DATE">
                <constraints nullable="false"/>
            </column>
            <column name="hours_worked" type="DOUBLE">
                <constraints nullable="false"/>
            </column>
            <column name="description" type="VARCHAR(2000)"/>
            <column name="status" type="VARCHAR(50)" defaultValue="DRAFT">
                <constraints nullable="false"/>
            </column>
            <column name="approved_by_id" type="BIGINT"/>
            <column name="approved_at" type="DATETIME"/>
            <column name="rejection_reason" type="VARCHAR(1000)"/>
            <column name="created_at" type="DATETIME" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
            <column name="updated_at" type="DATETIME" defaultValueComputed="CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
        </createTable>

        <addForeignKeyConstraint baseTableName="timesheet_entries" baseColumnNames="user_id"
                                 referencedTableName="users" referencedColumnNames="id"
                                 constraintName="fk_timesheet_developer" onDelete="CASCADE"/>
        <addForeignKeyConstraint baseTableName="timesheet_entries" baseColumnNames="project_id"
                                 referencedTableName="projects" referencedColumnNames="id"
                                 constraintName="fk_timesheet_project" onDelete="CASCADE"/>
        <addForeignKeyConstraint baseTableName="timesheet_entries" baseColumnNames="task_id"
                                 referencedTableName="tasks" referencedColumnNames="id"
                                 constraintName="fk_timesheet_task" onDelete="SET NULL"/>
        <addForeignKeyConstraint baseTableName="timesheet_entries" baseColumnNames="approved_by_id"
                                 referencedTableName="users" referencedColumnNames="id"
                                 constraintName="fk_timesheet_approver" onDelete="SET NULL"/>

        <createIndex tableName="timesheet_entries" indexName="idx_developer">
            <column name="user_id"/>
        </createIndex>
        <createIndex tableName="timesheet_entries" indexName="idx_project">
            <column name="project_id"/>
        </createIndex>
        <createIndex tableName="timesheet_entries" indexName="idx_status">
            <column name="status"/>
        </createIndex>
        <createIndex tableName="timesheet_entries" indexName="idx_work_date">
            <column name="work_date"/>
        </createIndex>
        <createIndex tableName="timesheet_entries" indexName="idx_developer_date">
            <column name="user_id"/>
            <column name="work_date"/>
        </createIndex>
        <createIndex tableName="timesheet_entries" indexName="idx_project_date">
            <column name="project_id"/>
            <column name="work_date"/>
        </createIndex>
    </changeSet>
</databaseChangeLog>
```

## Spring Data JPA Approach (Automatic Schema)

If using Spring Data JPA with `spring.jpa.hibernate.ddl-auto=update`, the TimesheetEntry entity will auto-create the table.

1. The `@Entity` annotation on `TimesheetEntry.java` will be picked up automatically
2. Hibernate will create the table on application startup
3. Ensure column names and types match the SQL above

## Flyway Migration (Alternative)

Create `db/migration/V1__create_timesheet_table.sql`:

```sql
CREATE TABLE timesheet_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    task_id BIGINT,
    work_date DATE NOT NULL,
    hours_worked DOUBLE NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    approved_by_id BIGINT,
    approved_at DATETIME,
    rejection_reason VARCHAR(1000),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_timesheet_developer FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_timesheet_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_timesheet_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_timesheet_approver FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_hours_positive CHECK (hours_worked > 0),
    
    INDEX idx_developer (user_id),
    INDEX idx_project (project_id),
    INDEX idx_task (task_id),
    INDEX idx_status (status),
    INDEX idx_work_date (work_date),
    INDEX idx_created_at (created_at),
    INDEX idx_developer_date (user_id, work_date),
    INDEX idx_project_date (project_id, work_date)
);
```

## Verify Table Creation

After running migration, verify the table exists:

```sql
-- Show table structure
DESCRIBE timesheet_entries;

-- Or for detailed column info:
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'your_database' AND TABLE_NAME = 'timesheet_entries';

-- Verify indexes
SHOW INDEXES FROM timesheet_entries;

-- Verify foreign keys
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'timesheet_entries';
```

## Rollback Script (If Needed)

```sql
-- Rollback: Drop Timesheets Table
ALTER TABLE timesheet_entries DROP FOREIGN KEY fk_timesheet_developer;
ALTER TABLE timesheet_entries DROP FOREIGN KEY fk_timesheet_project;
ALTER TABLE timesheet_entries DROP FOREIGN KEY fk_timesheet_task;
ALTER TABLE timesheet_entries DROP FOREIGN KEY fk_timesheet_approver;

DROP TABLE IF EXISTS timesheet_entries;
```

## Column Constraints Explained

| Column | Type | Required | Constraint | Purpose |
|--------|------|----------|-----------|---------|
| `id` | BIGINT | Yes | PK, Auto | Unique identifier |
| `user_id` | BIGINT | Yes | FK, NOT NULL | Developer who logged hours |
| `project_id` | BIGINT | Yes | FK, NOT NULL | Project for billing |
| `task_id` | BIGINT | No | FK (nullable) | Optional task reference |
| `work_date` | DATE | Yes | NOT NULL | Date work was performed |
| `hours_worked` | DOUBLE | Yes | > 0 CHECK | Billable hours |
| `description` | VARCHAR(2000) | No | - | What was worked on |
| `status` | VARCHAR(50) | Yes | Default='DRAFT' | DRAFT, SUBMITTED, APPROVED, REJECTED |
| `approved_by_id` | BIGINT | No | FK (nullable) | Manager who approved |
| `approved_at` | DATETIME | No | - | When approved |
| `rejection_reason` | VARCHAR(1000) | No | - | Why rejected |
| `created_at` | DATETIME | Yes | Default=NOW | Created timestamp |
| `updated_at` | DATETIME | Yes | Default=NOW | Updated timestamp |

## Index Strategy

Indexes optimize these common queries:

1. **idx_developer**: Find timesheets by developer
2. **idx_project**: Find timesheets by project
3. **idx_status**: Filter by approval status
4. **idx_work_date**: Query by date
5. **idx_developer_date**: Developer's entries in date range (compound)
6. **idx_project_date**: Project's entries in date range (compound)

These indexes support all repository queries in `TimesheetEntryRepository.java`.

## Integration Checklist

- [ ] Create/run database migration
- [ ] Verify table creation with DESCRIBE
- [ ] Test foreign key constraints
- [ ] Insert sample data for testing
- [ ] Verify indexes are created
- [ ] Test queries on empty table
- [ ] Deploy and test with full dataset
- [ ] Monitor query performance
- [ ] Set up backup strategy

---

**Note**: Adjust table name, column names, and data types based on your actual database schema naming conventions and existing table references.
