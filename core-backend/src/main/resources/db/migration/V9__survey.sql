-- Survey: 1 SO -> 1 Survey -> 1 Surveyor (README 9.2, no resurvey loop). Only credit SOs (any item with
-- payment_term_months > 0) need a survey; cash-only SOs skip straight to confirmation.
-- Rejected survey makes the SO permanently rejected (distinct from the revisable price-negotiation
-- rejection), hence the separate SURVEY_REJECTED status rather than reusing REJECTED.

create table survey (
    id                        uuid primary key,
    sales_order_id            uuid        not null unique references sales_order (id),
    surveyor_employee_id      uuid references employee (id),
    status                    varchar(20) not null default 'PENDING', -- PENDING | APPROVED | REJECTED
    monthly_income            numeric(14, 2),
    monthly_expenses          numeric(14, 2),
    existing_obligations      varchar(500),
    residence_notes           varchar(500),
    employment_notes          varchar(500),
    references_notes          varchar(500),
    ability_to_pay_assessment varchar(500),
    decided_at                timestamptz,
    decision_notes            varchar(500),
    created_at                timestamptz not null default now(),
    updated_at                timestamptz not null default now(),
    created_by                uuid,
    updated_by                uuid
);

-- SURVEY_REJECTED / CONFIRMED extend the sales_order status column (no schema change needed, it's varchar).

insert into permission (id, code, description) values
    (gen_random_uuid(), 'SURVEY_MANAGE', 'Create/assign surveys and record survey assessment'),
    (gen_random_uuid(), 'SURVEY_DECIDE', 'Record the Approved/Rejected survey result');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code = 'SURVEY_MANAGE';

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code = 'SURVEYOR'
  and p.code in ('SURVEY_MANAGE', 'SURVEY_DECIDE');
