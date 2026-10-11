create table employee_attendance (
    id uuid primary key,
    employee_id uuid not null references employee(id),
    store_id uuid not null references store(id),
    work_date date not null,
    check_in_time timestamptz,
    check_out_time timestamptz,
    status varchar(30) not null,
    notes text,
    created_at timestamptz not null default now(),
    unique(employee_id, work_date)
);

create index idx_attendance_employee on employee_attendance (employee_id);
create index idx_attendance_store on employee_attendance (store_id);
create index idx_attendance_date on employee_attendance (work_date);

create table leave_request (
    id uuid primary key,
    request_number varchar(50) not null unique,
    employee_id uuid not null references employee(id),
    leave_type varchar(30) not null,
    start_date date not null,
    end_date date not null,
    days_count int not null check (days_count > 0),
    reason text not null,
    status varchar(30) not null,
    approved_by_id uuid references employee(id),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_leave_employee on leave_request (employee_id);
create index idx_leave_status on leave_request (status);

create table payroll_period (
    id uuid primary key,
    period_code varchar(50) not null unique,
    name varchar(100) not null,
    store_id uuid references store(id),
    start_date date not null,
    end_date date not null,
    cutoff_date date not null,
    payout_date date not null,
    status varchar(30) not null,
    approved_by_id uuid references employee(id),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_payroll_period_store on payroll_period (store_id);
create index idx_payroll_period_dates on payroll_period (start_date, end_date);
create index idx_payroll_period_status on payroll_period (status);

create table payroll_slip (
    id uuid primary key,
    slip_number varchar(50) not null unique,
    payroll_period_id uuid not null references payroll_period(id),
    employee_id uuid not null references employee(id),
    base_salary numeric(15, 2) not null default 0 check (base_salary >= 0),
    allowances numeric(15, 2) not null default 0 check (allowances >= 0),
    sales_commission numeric(15, 2) not null default 0 check (sales_commission >= 0),
    collection_incentive numeric(15, 2) not null default 0 check (collection_incentive >= 0),
    deductions numeric(15, 2) not null default 0 check (deductions >= 0),
    net_salary numeric(15, 2) not null default 0,
    attendance_days int not null default 0,
    payment_status varchar(30) not null default 'UNPAID',
    paid_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(payroll_period_id, employee_id)
);

create index idx_payroll_slip_period on payroll_slip (payroll_period_id);
create index idx_payroll_slip_employee on payroll_slip (employee_id);

-- Permissions
insert into permission (id, code, description) values
    (gen_random_uuid(), 'HR_MANAGE', 'Manage employee leave requests, attendance rosters, and employee files'),
    (gen_random_uuid(), 'PAYROLL_MANAGE', 'Calculate period commission, generate payroll runs, and freeze payroll slips'),
    (gen_random_uuid(), 'ATTENDANCE_RECORD', 'Record daily employee clock-in and clock-out attendance');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER')
  and p.code in ('HR_MANAGE', 'PAYROLL_MANAGE', 'ATTENDANCE_RECORD')
on conflict do nothing;

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('ADMIN', 'CASHIER', 'WAREHOUSE', 'SURVEYOR', 'COLLECTOR')
  and p.code in ('ATTENDANCE_RECORD')
on conflict do nothing;
