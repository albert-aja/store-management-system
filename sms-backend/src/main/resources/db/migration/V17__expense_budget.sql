create table expense_category (
    id uuid primary key,
    code varchar(50) not null unique,
    name varchar(100) not null,
    description text,
    monthly_limit numeric(15, 2),
    requires_receipt boolean not null default true,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_expense_category_active on expense_category (is_active);

create table budget_request (
    id uuid primary key,
    request_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    expense_category_id uuid not null references expense_category(id),
    period_month int not null check (period_month between 1 and 12),
    period_year int not null check (period_year >= 2020),
    requested_amount numeric(15, 2) not null check (requested_amount >= 0),
    approved_amount numeric(15, 2) not null default 0 check (approved_amount >= 0),
    status varchar(30) not null,
    requested_by_id uuid not null references employee(id),
    approved_by_id uuid references employee(id),
    justification text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(store_id, expense_category_id, period_month, period_year)
);

create index idx_budget_request_store on budget_request (store_id);
create index idx_budget_request_category on budget_request (expense_category_id);
create index idx_budget_request_period on budget_request (period_year, period_month);
create index idx_budget_request_status on budget_request (status);

create table expense (
    id uuid primary key,
    expense_number varchar(50) not null unique,
    store_id uuid not null references store(id),
    expense_category_id uuid not null references expense_category(id),
    budget_request_id uuid references budget_request(id),
    amount numeric(15, 2) not null check (amount > 0),
    expense_date date not null,
    payment_method varchar(30) not null,
    payee_name varchar(150),
    description text not null,
    receipt_url varchar(500),
    is_overrun boolean not null default false,
    status varchar(30) not null,
    created_by_id uuid not null references employee(id),
    approved_by_id uuid references employee(id),
    activity_type varchar(50),
    reference_id uuid,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_expense_store on expense (store_id);
create index idx_expense_category on expense (expense_category_id);
create index idx_expense_status on expense (status);
create index idx_expense_date on expense (expense_date);
create index idx_expense_activity on expense (activity_type);

-- Seed standard expense categories
insert into expense_category (id, code, name, description, monthly_limit, requires_receipt, is_active) values
    (gen_random_uuid(), 'STORE_UTILITIES', 'Store Utilities', 'Electricity, water, internet, and municipal fees', 5000000.00, true, true),
    (gen_random_uuid(), 'VEHICLE_OPS', 'Vehicle Fuel & Maintenance', 'Delivery truck fuel, oil change, tire replacement, vehicle tax', 8000000.00, true, true),
    (gen_random_uuid(), 'FIELD_COLLECTION', 'Field Collection Costs', 'Transport stipends and parking for collection officers', 3000000.00, true, true),
    (gen_random_uuid(), 'OFFICE_SUPPLIES', 'Office & Stationery Supplies', 'Printing paper, thermal rolls, printer ink, office pantry', 2000000.00, true, true),
    (gen_random_uuid(), 'MARKETING', 'Marketing & Promotions', 'Local flyers, banners, social media boosts, showroom decorations', 6000000.00, true, true),
    (gen_random_uuid(), 'STORE_MAINTENANCE', 'Store Building Maintenance', 'AC servicing, electrical repairs, painting, showroom fixtures', 4000000.00, true, true),
    (gen_random_uuid(), 'GENERAL_EXPENSE', 'General & Miscellaneous', 'Emergency petty cash expenses and sundry costs', 2000000.00, true, true);

-- Permissions
insert into permission (id, code, description) values
    (gen_random_uuid(), 'EXPENSE_MANAGE', 'Manage expense categories, budget limits, and approve store expenses'),
    (gen_random_uuid(), 'EXPENSE_CREATE', 'Submit store expense records, upload receipts, and request disbursements'),
    (gen_random_uuid(), 'BUDGET_MANAGE', 'Allocate store monthly budgets and review budget consumption');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER')
  and p.code in ('EXPENSE_MANAGE', 'EXPENSE_CREATE', 'BUDGET_MANAGE')
on conflict do nothing;

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('ADMIN', 'CASHIER', 'WAREHOUSE')
  and p.code in ('EXPENSE_CREATE')
on conflict do nothing;
