-- Sales Order: central commercial record. Draft = salesperson workspace (no number, no survey/reservation
-- trigger yet). Release requires completeness and, if price was negotiated, an APPROVED price-approval
-- request via the generic approval engine before an official number is assigned (README sec 8, 20#1/#4).
-- Actual stock reservation is deferred until the Inventory module exists (no Stock Unit table yet).

create table sales_order (
    id                          uuid primary key,
    number                      varchar(60) unique, -- null while Draft; assigned only at release
    store_id                    uuid        not null references store (id),
    customer_id                 uuid        not null references customer (id),
    salesperson_employee_id     uuid        not null references employee (id),
    delivery_address_id         uuid references customer_address (id),
    delivery_address_snapshot   varchar(300),
    status                      varchar(30) not null default 'DRAFT',
    requires_price_approval     boolean     not null default false,
    approval_request_id         uuid references approval_request (id),
    released_at                 timestamptz,
    cancelled_at                timestamptz,
    cancel_reason               varchar(300),
    created_at                  timestamptz not null default now(),
    updated_at                  timestamptz not null default now(),
    created_by                  uuid,
    updated_by                  uuid
);

create index idx_sales_order_customer on sales_order (customer_id);
create index idx_sales_order_store on sales_order (store_id);
create index idx_sales_order_status on sales_order (status);

create table sales_order_item (
    id                   uuid primary key,
    sales_order_id       uuid           not null references sales_order (id),
    product_variant_id   uuid           not null references product_variant (id),
    quantity             int            not null,
    payment_term_months  int            not null default 0, -- 0 = cash
    reference_price      numeric(14, 2) not null,            -- snapshot from store pricing at time added
    final_price          numeric(14, 2) not null,            -- agreed unit price; may differ if negotiated
    notes                varchar(300),
    created_at           timestamptz    not null default now(),
    updated_at           timestamptz    not null default now(),
    created_by           uuid,
    updated_by           uuid
);

create index idx_sales_order_item_so on sales_order_item (sales_order_id);

insert into permission (id, code, description) values
    (gen_random_uuid(), 'SALES_ORDER_MANAGE', 'Create/update draft SOs, add items, submit for approval, release, cancel');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN', 'SALESPERSON')
  and p.code = 'SALES_ORDER_MANAGE';
