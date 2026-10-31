-- Customer domain: company-wide master (no per-store duplication, never deleted), contacts, addresses.
-- Customer documents reuse the generic document_record table (owner_type = 'CUSTOMER'); no separate table here.

create table customer (
    id             uuid primary key,
    nik            varchar(20) unique,
    full_name      varchar(150) not null,
    primary_phone  varchar(30),
    primary_email  varchar(150),
    active         boolean      not null default true,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now(),
    created_by     uuid,
    updated_by     uuid
);

create index idx_customer_full_name on customer (full_name);
create index idx_customer_primary_phone on customer (primary_phone);

create table customer_contact (
    id             uuid primary key,
    customer_id    uuid        not null references customer (id),
    contact_type   varchar(30) not null, -- PHONE | EMAIL | OTHER
    label          varchar(60),
    value          varchar(150) not null,
    notes          varchar(300),
    active         boolean      not null default true,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now(),
    created_by     uuid,
    updated_by     uuid
);

create index idx_customer_contact_customer on customer_contact (customer_id);

create table customer_address (
    id             uuid primary key,
    customer_id    uuid        not null references customer (id),
    label          varchar(60), -- HOME | WORK | OTHER
    address_line   varchar(300) not null,
    notes          varchar(300),
    is_primary     boolean      not null default false,
    active         boolean      not null default true,
    created_at     timestamptz  not null default now(),
    updated_at     timestamptz  not null default now(),
    created_by     uuid,
    updated_by     uuid
);

create index idx_customer_address_customer on customer_address (customer_id);

-- Only one active primary address per customer.
create unique index uq_customer_address_primary on customer_address (customer_id) where is_primary and active;

insert into permission (id, code, description) values
    (gen_random_uuid(), 'CUSTOMER_MANAGE', 'Create/update customer master, contacts, and addresses');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN', 'SALESPERSON')
  and p.code = 'CUSTOMER_MANAGE';
