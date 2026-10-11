-- Procurement (slice 1): Supplier (+ contacts) and Purchase Order (+ items). Receiving and supplier payments
-- follow in later migrations. Purchase cost lives on PO item as transaction data, not on Product master
-- (README 10.1). PO number is assigned only when the PO is issued (after approval), mirroring the SO pattern.

create table supplier (
    id              uuid primary key,
    name            varchar(150) not null,
    code            varchar(40) unique,
    address         varchar(300),
    notes           varchar(300),
    active          boolean      not null default true,
    created_at      timestamptz  not null default now(),
    updated_at      timestamptz  not null default now(),
    created_by      uuid,
    updated_by      uuid
);

create index idx_supplier_name on supplier (name);

create table supplier_contact (
    id            uuid primary key,
    supplier_id   uuid         not null references supplier (id),
    contact_type  varchar(30)  not null,
    label         varchar(60),
    value         varchar(150) not null,
    notes         varchar(300),
    active        boolean      not null default true,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now(),
    created_by    uuid,
    updated_by    uuid
);

create index idx_supplier_contact_supplier on supplier_contact (supplier_id);

create table purchase_order (
    id                   uuid primary key,
    number               varchar(60) unique, -- null until issued
    store_id             uuid        not null references store (id),
    supplier_id          uuid        not null references supplier (id),
    status               varchar(30) not null default 'DRAFT',
    approval_request_id  uuid references approval_request (id),
    issued_at            timestamptz,
    cancelled_at         timestamptz,
    cancel_reason        varchar(300),
    notes                varchar(300),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    created_by           uuid,
    updated_by           uuid
);

create index idx_purchase_order_store on purchase_order (store_id);
create index idx_purchase_order_supplier on purchase_order (supplier_id);
create index idx_purchase_order_status on purchase_order (status);

create table purchase_order_item (
    id                    uuid primary key,
    purchase_order_id     uuid           not null references purchase_order (id),
    product_variant_id    uuid references product_variant (id),
    product_component_id  uuid references product_component (id),
    quantity              int            not null,
    unit_cost             numeric(14, 2) not null, -- agreed supplier cost
    notes                 varchar(300),
    created_at            timestamptz    not null default now(),
    updated_at            timestamptz    not null default now(),
    created_by            uuid,
    updated_by            uuid,
    constraint chk_po_item_subject check (
        (product_variant_id is not null and product_component_id is null)
        or (product_variant_id is null and product_component_id is not null)
    ),
    constraint chk_po_item_quantity check (quantity > 0),
    constraint chk_po_item_cost check (unit_cost >= 0)
);

create index idx_po_item_po on purchase_order_item (purchase_order_id);

insert into permission (id, code, description) values
    (gen_random_uuid(), 'PROCUREMENT_MANAGE', 'Manage suppliers; create/update draft POs, submit for approval, issue, cancel');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code = 'PROCUREMENT_MANAGE';
