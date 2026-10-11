-- Foundation schema: stores, employees, roles/permissions, current assignments.
-- Employees and stores are never physically deleted; employment_status/active flags represent lifecycle.

create extension if not exists pgcrypto;

create table store (
    id              uuid primary key,
    code            varchar(20)  not null unique,
    name            varchar(150) not null,
    address         varchar(300),
    active          boolean      not null default true,
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz  not null default now(),
    created_by      uuid,
    updated_by      uuid
);

create table employee (
    id                      uuid primary key,
    employee_number         varchar(30)  not null unique,
    full_name               varchar(150) not null,
    nik                     varchar(20) unique,
    phone                   varchar(30),
    email                   varchar(150),
    birth_date              date,
    address                 varchar(300),
    emergency_contact_name  varchar(150),
    emergency_contact_phone varchar(30),
    employment_type         varchar(20)  not null, -- PERMANENT | FREELANCE
    employment_status       varchar(20)  not null default 'ACTIVE', -- ACTIVE | INACTIVE
    auth_user_id            uuid unique, -- Supabase auth user id; null when employee has no app login
    hire_date               date,
    notes                   varchar(500),
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create table role (
    id          uuid primary key,
    code        varchar(40)  not null unique,
    name        varchar(100) not null,
    description varchar(300),
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table permission (
    id          uuid primary key,
    code        varchar(60)  not null unique,
    description varchar(300),
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table role_permission (
    id            uuid primary key,
    role_id       uuid not null references role (id),
    permission_id uuid not null references permission (id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    created_by    uuid,
    updated_by    uuid,
    unique (role_id, permission_id)
);

-- Current role assignment (not a history table; event-time attribution lives on business records later).
create table employee_role (
    id          uuid primary key,
    employee_id uuid not null references employee (id),
    role_id     uuid not null references role (id),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    created_by  uuid,
    updated_by  uuid,
    unique (employee_id, role_id)
);

-- Current store assignment(s); an employee may be assigned to more than one store.
create table employee_store (
    id          uuid primary key,
    employee_id uuid not null references employee (id),
    store_id    uuid not null references store (id),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    created_by  uuid,
    updated_by  uuid,
    unique (employee_id, store_id)
);

-- Current reporting supervisor; one active supervisor per employee.
create table employee_reporting (
    id                     uuid primary key,
    employee_id            uuid not null unique references employee (id),
    supervisor_employee_id uuid not null references employee (id),
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now(),
    created_by             uuid,
    updated_by             uuid
);
