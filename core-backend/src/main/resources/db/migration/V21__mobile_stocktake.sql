create table stocktake_session (
    id                       uuid primary key,
    store_id                 uuid        not null references store (id),
    opened_by_employee_id    uuid        not null references employee (id),
    status                   varchar(20) not null default 'OPEN',
    submitted_at             timestamptz,
    reviewed_by_employee_id  uuid references employee (id),
    reviewed_at              timestamptz,
    review_comment           varchar(500),
    created_at               timestamptz not null default now(),
    updated_at               timestamptz not null default now(),
    created_by               uuid,
    updated_by               uuid
);

create index idx_stocktake_session_store_status
    on stocktake_session (store_id, status, created_at desc);

create table stocktake_count_line (
    id                  uuid primary key,
    session_id          uuid        not null references stocktake_session (id),
    stock_unit_id       uuid references stock_unit (id),
    product_variant_id  uuid references product_variant (id),
    scan_code           varchar(100) not null,
    variant_name        varchar(150),
    expected            boolean     not null,
    counted             boolean     not null default false,
    variance            varchar(20),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    created_by          uuid,
    updated_by          uuid,
    unique (session_id, scan_code)
);

create index idx_stocktake_line_session on stocktake_count_line (session_id);

insert into permission (id, code, description) values
    (gen_random_uuid(), 'STOCKTAKE_COUNT', 'Open stocktake sessions, scan physical inventory, and submit counts for review'),
    (gen_random_uuid(), 'DELIVERY_PACK', 'View delivery packing manifests and verify picked stock-unit serials');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN', 'HELPER')
  and p.code in ('STOCKTAKE_COUNT', 'DELIVERY_PACK');
