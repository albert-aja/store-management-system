-- V22__customer_360_crm.sql
-- Customer 360, CRM & Omnichannel Experience (Backlog J.1 - J.7)

-- 1. Extend customer master table with demographic and scoring attributes (J.2, J.4)
alter table customer
    add column if not exists mother_maiden_name varchar(150),
    add column if not exists birth_date date,
    add column if not exists birth_place varchar(100),
    add column if not exists segment varchar(50) not null default 'STANDARD',
    add column if not exists credit_score_grade varchar(5) not null default 'B',
    add column if not exists credit_score_points int not null default 80,
    add column if not exists total_orders_count int not null default 0,
    add column if not exists clv_amount numeric(15,2) not null default 0.00;

create index if not exists idx_customer_segment on customer (segment);
create index if not exists idx_customer_credit_grade on customer (credit_score_grade);

-- 2. Customer Tags (J.2 Demographic & Behavioral Segmentation)
create table if not exists customer_tag (
    id          uuid primary key,
    customer_id uuid        not null references customer (id) on delete cascade,
    tag_name    varchar(50) not null,
    color       varchar(20) not null default '#1976d2',
    created_at  timestamptz not null default now(),
    created_by  uuid,
    unique (customer_id, tag_name)
);

create index if not exists idx_customer_tag_customer on customer_tag (customer_id);
create index if not exists idx_customer_tag_name on customer_tag (tag_name);

-- 3. Customer Omnichannel Communication & Interaction History (J.6)
create table if not exists customer_interaction (
    id                      uuid primary key,
    customer_id             uuid        not null references customer (id) on delete cascade,
    channel                 varchar(30) not null, -- IN_PERSON, PHONE_CALL, WHATSAPP, SMS, EMAIL
    direction               varchar(20) not null default 'OUTBOUND', -- INBOUND, OUTBOUND
    summary                 varchar(255) not null,
    details                 text,
    outcome                 varchar(40) not null default 'NEUTRAL', -- POSITIVE, NEUTRAL, NEGATIVE, NO_ANSWER, FOLLOW_UP_REQUIRED
    recorded_by_employee_id uuid references employee (id),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create index if not exists idx_customer_interaction_cust on customer_interaction (customer_id, created_at desc);

-- 4. Customer Follow-up Scheduler & Automated Reminder Engine (J.7)
create table if not exists customer_follow_up (
    id                      uuid primary key,
    customer_id             uuid        not null references customer (id) on delete cascade,
    title                   varchar(255) not null,
    follow_up_type          varchar(40) not null default 'GENERAL', -- SALES_LEAD, PAYMENT_REMINDER, SERVICE_CHECKIN, GENERAL
    scheduled_at            timestamptz not null,
    assigned_employee_id    uuid references employee (id),
    status                  varchar(20) not null default 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED, OVERDUE
    notes                   text,
    completed_at            timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create index if not exists idx_customer_followup_cust on customer_follow_up (customer_id, scheduled_at asc);
create index if not exists idx_customer_followup_status on customer_follow_up (status, scheduled_at asc);

-- 5. Customer Promise-to-Pay (PTP) Tracking Engine (J.3)
create table if not exists customer_promise_to_pay (
    id                      uuid primary key,
    customer_id             uuid        not null references customer (id) on delete cascade,
    sales_order_id          uuid references sales_order (id),
    promised_amount         numeric(15,2) not null,
    promised_date           date        not null,
    status                  varchar(20) not null default 'PENDING', -- PENDING, KEPT, BROKEN, CANCELLED
    notes                   text,
    recorded_by_employee_id uuid references employee (id),
    resolved_at             timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create index if not exists idx_ptp_customer on customer_promise_to_pay (customer_id, promised_date desc);
create index if not exists idx_ptp_status on customer_promise_to_pay (status, promised_date asc);

-- 6. Customer Store Credit Ledger (J.5) - Money Management Credit Balance (Not Banking)
create table if not exists customer_store_credit_entry (
    id              uuid primary key,
    customer_id     uuid        not null references customer (id) on delete cascade,
    entry_type      varchar(30) not null, -- GRANT, REDEEM, EXPIRE, ADJUSTMENT
    amount          numeric(15,2) not null,
    balance_after   numeric(15,2) not null,
    reference_type  varchar(50), -- SALES_ORDER, PROMOTION, REFUND_VOUCHER, MANUAL
    reference_id    uuid,
    notes           text,
    created_at      timestamptz not null default now(),
    created_by      uuid
);

create index if not exists idx_store_credit_cust on customer_store_credit_entry (customer_id, created_at desc);

-- 7. Store Gift Vouchers & Promotional Coupons (J.5)
create table if not exists store_voucher (
    id                      uuid primary key,
    code                    varchar(50)  not null unique,
    title                   varchar(150) not null,
    voucher_type            varchar(30)  not null default 'FIXED_AMOUNT', -- FIXED_AMOUNT, PERCENTAGE
    discount_value          numeric(15,2) not null,
    min_order_amount        numeric(15,2),
    max_discount_amount     numeric(15,2),
    valid_from              date         not null,
    valid_until             date         not null,
    max_uses                int          not null default 1,
    times_used              int          not null default 0,
    active                  boolean      not null default true,
    assigned_customer_id    uuid references customer (id),
    notes                   varchar(255),
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create index if not exists idx_store_voucher_code on store_voucher (code);
create index if not exists idx_store_voucher_cust on store_voucher (assigned_customer_id);

-- 8. CRM & Omnichannel Permissions
insert into permission (id, code, description) values
    (gen_random_uuid(), 'CUSTOMER_CRM_VIEW', 'View Customer 360 profile, timeline, interactions, and credit scoring'),
    (gen_random_uuid(), 'CUSTOMER_CRM_MANAGE', 'Log omnichannel interactions, manage follow-up reminders, and handle PTPs'),
    (gen_random_uuid(), 'STORE_CREDIT_MANAGE', 'Grant and adjust customer store credit balances and vouchers')
on conflict do nothing;

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN', 'SPV', 'SALES', 'COLLECTOR')
  and p.code in ('CUSTOMER_CRM_VIEW', 'CUSTOMER_CRM_MANAGE')
on conflict do nothing;

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code in ('STORE_CREDIT_MANAGE')
on conflict do nothing;

