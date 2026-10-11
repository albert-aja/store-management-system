-- Generic document/attachment metadata (Supabase Storage-backed) and persistent notifications.
-- Document numbering itself (business document numbers like SO/PO codes) lives in Redis, not here.

create table document_record (
    id              uuid primary key,
    owner_type      varchar(60)  not null,
    owner_id        uuid         not null,
    storage_bucket  varchar(100) not null,
    storage_path    varchar(500) not null,
    file_name       varchar(255) not null,
    mime_type       varchar(150),
    uploaded_by     uuid         not null,
    uploaded_at     timestamptz  not null default now(),
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz  not null default now(),
    created_by      uuid,
    updated_by      uuid
);

create index idx_document_owner on document_record (owner_type, owner_id);

create table notification (
    id             uuid primary key,
    reference_type varchar(60),
    reference_id   uuid,
    title          varchar(200) not null,
    body           varchar(1000),
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now(),
    created_by     uuid,
    updated_by     uuid
);

create table notification_recipient (
    id              uuid primary key,
    notification_id uuid not null references notification (id),
    employee_id     uuid not null references employee (id),
    read_at         timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    created_by      uuid,
    updated_by      uuid,
    unique (notification_id, employee_id)
);

create index idx_notification_recipient_employee on notification_recipient (employee_id, read_at);
