-- Generic approval workflow engine. A request snapshots its steps so later workflow
-- edits never rewrite the history of an already-created request (README 3.4 invariant).

create table approval_workflow (
    id          uuid primary key,
    code        varchar(60)  not null unique,
    name        varchar(150) not null,
    description varchar(300),
    active      boolean      not null default true,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table approval_workflow_step (
    id                  uuid primary key,
    workflow_id         uuid not null references approval_workflow (id),
    step_order          int  not null,
    name                varchar(150) not null,
    approver_role_code  varchar(40)  not null references role (code),
    description         varchar(300),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    created_by          uuid,
    updated_by          uuid,
    unique (workflow_id, step_order)
);

-- reference_type + reference_id generically link to any business object (SO, PO, price negotiation, ...).
create table approval_request (
    id                uuid primary key,
    workflow_id       uuid not null references approval_workflow (id),
    reference_type    varchar(60) not null,
    reference_id      uuid        not null,
    status             varchar(20) not null default 'PENDING', -- PENDING | APPROVED | REJECTED | CANCELLED
    current_step_order int         not null default 1,
    requested_by      uuid        not null,
    requested_at      timestamptz not null default now(),
    decided_at        timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    created_by        uuid,
    updated_by        uuid
);

create index idx_approval_request_reference on approval_request (reference_type, reference_id);

-- Snapshot of workflow steps at request-creation time.
create table approval_request_step (
    id                 uuid primary key,
    request_id         uuid not null references approval_request (id),
    step_order         int  not null,
    name               varchar(150) not null,
    approver_role_code varchar(40)  not null,
    status             varchar(20)  not null default 'PENDING', -- PENDING | APPROVED | REJECTED | SKIPPED
    decided_by         uuid,
    decided_at         timestamptz,
    comment            varchar(500),
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    created_by         uuid,
    updated_by         uuid,
    unique (request_id, step_order)
);
