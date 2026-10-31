-- V16__repossession_warranty.sql
-- Stock Return (Repossession, Warranty Return), Return Dispositions, Repairs, Warranty Claims, and Scrap Disposal

create table stock_return (
    id uuid primary key,
    return_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    customer_id uuid not null references customer(id),
    sales_order_id uuid references sales_order(id),
    stock_unit_id uuid not null references stock_unit(id),
    receivable_id uuid references receivable(id),
    return_type varchar(30) not null,
    status varchar(30) not null default 'INITIATED',
    driver_id uuid references employee(id),
    helper_id uuid references employee(id),
    vehicle_plate varchar(20),
    scheduled_date date,
    recovered_at timestamptz,
    customer_refusal_reason text,
    reason text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_stock_return_store on stock_return (store_id);
create index idx_stock_return_customer on stock_return (customer_id);
create index idx_stock_return_unit on stock_return (stock_unit_id);
create index idx_stock_return_status on stock_return (status);

create table stock_return_disposition (
    id uuid primary key,
    stock_return_id uuid not null references stock_return(id) on delete cascade,
    inspector_employee_id uuid not null references employee(id),
    condition_notes text not null,
    disposition varchar(30) not null,
    resale_price numeric(15, 2),
    inspected_at timestamptz not null default now()
);

create index idx_return_disposition_return on stock_return_disposition (stock_return_id);

create table warranty_claim (
    id uuid primary key,
    claim_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    customer_id uuid not null references customer(id),
    sales_order_id uuid references sales_order(id),
    stock_unit_id uuid not null references stock_unit(id),
    replacement_stock_unit_id uuid references stock_unit(id),
    distributor_name varchar(150),
    defect_description text not null,
    distributor_claim_ref varchar(100),
    coverage_decision varchar(30) not null default 'PENDING',
    status varchar(30) not null default 'OPEN',
    decision_notes text,
    resolution_date timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_warranty_claim_store on warranty_claim (store_id);
create index idx_warranty_claim_customer on warranty_claim (customer_id);
create index idx_warranty_claim_unit on warranty_claim (stock_unit_id);
create index idx_warranty_claim_status on warranty_claim (status);

create table repair_ticket (
    id uuid primary key,
    ticket_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    stock_unit_id uuid not null references stock_unit(id),
    warranty_claim_id uuid references warranty_claim(id),
    stock_return_id uuid references stock_return(id),
    vendor_name varchar(150),
    problem_description text not null,
    diagnosis text,
    action_taken text,
    repair_cost numeric(15, 2) not null default 0,
    status varchar(30) not null default 'DIAGNOSING',
    sent_at timestamptz,
    completed_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_repair_ticket_store on repair_ticket (store_id);
create index idx_repair_ticket_unit on repair_ticket (stock_unit_id);
create index idx_repair_ticket_status on repair_ticket (status);

create table stock_disposal (
    id uuid primary key,
    disposal_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    stock_unit_id uuid not null references stock_unit(id),
    reason varchar(50) not null,
    buyer_name varchar(150),
    scrap_proceeds numeric(15, 2) not null default 0,
    authorized_by_id uuid not null references employee(id),
    disposed_at timestamptz not null default now(),
    notes text,
    created_at timestamptz not null default now()
);

create index idx_stock_disposal_store on stock_disposal (store_id);
create index idx_stock_disposal_unit on stock_disposal (stock_unit_id);

-- Permissions
insert into permission (id, code, description) values
    (gen_random_uuid(), 'REPOSSESSION_MANAGE', 'Manage repossession orders, inspect returned units, set resale prices, authorize disposals'),
    (gen_random_uuid(), 'REPOSSESSION_EXECUTE', 'Execute recovery visits, transport returned items, log customer refusal'),
    (gen_random_uuid(), 'WARRANTY_MANAGE', 'Register warranty claims, record manufacturer decisions, coordinate replacements');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code in ('REPOSSESSION_MANAGE', 'REPOSSESSION_EXECUTE', 'WARRANTY_MANAGE');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('DRIVER', 'COLLECTOR')
  and p.code in ('REPOSSESSION_EXECUTE');
