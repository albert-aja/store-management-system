-- V45__employee_operational_tasks.sql
-- Backlog [L.4]: Employee-to-employee operational task assignment, due-date tracking, and collaboration hub.

CREATE TABLE IF NOT EXISTS operational_task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMPTZ,
    assigner_employee_id UUID NOT NULL REFERENCES employee(id),
    assignee_employee_id UUID NOT NULL REFERENCES employee(id),
    store_id UUID REFERENCES store(id),
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_operational_task_assignee ON operational_task(assignee_employee_id);
CREATE INDEX IF NOT EXISTS idx_operational_task_assigner ON operational_task(assigner_employee_id);
CREATE INDEX IF NOT EXISTS idx_operational_task_status ON operational_task(status);
CREATE INDEX IF NOT EXISTS idx_operational_task_due_date ON operational_task(due_date);
CREATE INDEX IF NOT EXISTS idx_operational_task_store ON operational_task(store_id);

CREATE TABLE IF NOT EXISTS task_comment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES operational_task(id) ON DELETE CASCADE,
    author_employee_id UUID NOT NULL REFERENCES employee(id),
    message TEXT NOT NULL,
    attachment_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comment_task ON task_comment(task_id);

