-- V15__finance.sql
-- Receivables, Installment Schedules, Customer Payments, Allocations, Cash Custody, Collection Attempts

create table receivable (
    id uuid primary key,
    receivable_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    customer_id uuid not null references customer(id),
    sales_order_id uuid not null references sales_order(id),
    sales_order_item_id uuid references sales_order_item(id),
    total_amount numeric(15, 2) not null,
    down_payment_amount numeric(15, 2) not null default 0,
    financed_amount numeric(15, 2) not null,
    total_paid numeric(15, 2) not null default 0,
    remaining_balance numeric(15, 2) not null,
    payment_term_months int not null default 0,
    status varchar(30) not null default 'ACTIVE',
    first_due_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_receivable_store on receivable (store_id);
create index idx_receivable_customer on receivable (customer_id);
create index idx_receivable_so on receivable (sales_order_id);
create index idx_receivable_status on receivable (status);

create table receivable_installment (
    id uuid primary key,
    receivable_id uuid not null references receivable(id) on delete cascade,
    installment_number int not null,
    due_date date not null,
    amount_due numeric(15, 2) not null,
    amount_paid numeric(15, 2) not null default 0,
    status varchar(30) not null default 'UNPAID',
    paid_at timestamptz,
    notes varchar(255),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint uq_receivable_installment unique (receivable_id, installment_number)
);

create index idx_installment_receivable on receivable_installment (receivable_id);
create index idx_installment_due_date on receivable_installment (due_date);
create index idx_installment_status on receivable_installment (status);

create table customer_payment (
    id uuid primary key,
    payment_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    customer_id uuid not null references customer(id),
    sales_order_id uuid references sales_order(id),
    amount numeric(15, 2) not null,
    payment_type varchar(30) not null default 'INSTALLMENT',
    payment_method varchar(30) not null default 'CASH',
    reference_number varchar(100),
    collected_by_id uuid references employee(id),
    paid_at timestamptz not null default now(),
    unallocated_amount numeric(15, 2) not null default 0,
    notes text,
    created_at timestamptz not null default now()
);

create index idx_payment_store on customer_payment (store_id);
create index idx_payment_customer on customer_payment (customer_id);
create index idx_payment_so on customer_payment (sales_order_id);

create table payment_allocation (
    id uuid primary key,
    customer_payment_id uuid not null references customer_payment(id) on delete cascade,
    receivable_installment_id uuid not null references receivable_installment(id),
    amount numeric(15, 2) not null,
    allocated_at timestamptz not null default now()
);

create index idx_allocation_payment on payment_allocation (customer_payment_id);
create index idx_allocation_installment on payment_allocation (receivable_installment_id);

create table payment_custody (
    id uuid primary key,
    customer_payment_id uuid not null references customer_payment(id) on delete cascade,
    holder_employee_id uuid not null references employee(id),
    handover_to_employee_id uuid references employee(id),
    status varchar(30) not null default 'HELD_BY_COLLECTOR',
    expected_amount numeric(15, 2) not null,
    received_amount numeric(15, 2),
    discrepancy_amount numeric(15, 2),
    collected_at timestamptz not null default now(),
    handed_over_at timestamptz,
    verified_at timestamptz,
    discrepancy_notes text,
    notes text
);

create index idx_custody_payment on payment_custody (customer_payment_id);
create index idx_custody_holder on payment_custody (holder_employee_id);
create index idx_custody_status on payment_custody (status);

create table collection_attempt (
    id uuid primary key,
    store_id uuid not null references store(id),
    customer_id uuid not null references customer(id),
    receivable_id uuid references receivable(id),
    assigned_employee_id uuid not null references employee(id),
    visit_date date not null,
    outcome varchar(30) not null,
    promised_payment_date date,
    customer_address_visited text,
    customer_payment_id uuid references customer_payment(id),
    notes text,
    created_at timestamptz not null default now()
);

create index idx_collection_store on collection_attempt (store_id);
create index idx_collection_customer on collection_attempt (customer_id);
create index idx_collection_receivable on collection_attempt (receivable_id);

-- Permissions
insert into permission (id, code, description) values
    (gen_random_uuid(), 'FINANCE_MANAGE', 'Manage credit schedules, receivables, review custody, and perform reconciliations'),
    (gen_random_uuid(), 'FINANCE_COLLECT', 'Record customer payments, collection visits, and hand over cash');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN', 'AR')
  and p.code in ('FINANCE_MANAGE', 'FINANCE_COLLECT');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('COLLECTOR')
  and p.code in ('FINANCE_COLLECT');
