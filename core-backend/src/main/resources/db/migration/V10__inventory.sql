-- Inventory: Stock Unit (permanent physical item, created only after receiving acceptance, never deleted),
-- Component Stock (loose spare quantity, deferred here from the Product module per README 6.2/6.5),
-- stock_movement ledger (physical/location changes only), reservation (single FK on stock_unit \u2014
-- trivially one-active-reservation-per-unit), allocation (so_item_stock_unit junction, README 7.2).

create table component_stock (
    id                    uuid primary key,
    store_id              uuid        not null references store (id),
    product_component_id  uuid        not null references product_component (id),
    quantity_on_hand      int         not null default 0,
    notes                 varchar(300),
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    created_by            uuid,
    updated_by            uuid,
    unique (store_id, product_component_id)
);

create table stock_unit (
    id                      uuid primary key,
    product_variant_id      uuid        not null references product_variant (id),
    manufacturer_serial     varchar(100) unique,
    current_store_id        uuid        not null references store (id),
    location_type           varchar(30) not null default 'WAREHOUSE',
    availability_status     varchar(20) not null default 'AVAILABLE',
    reserved_for_so_item_id uuid references sales_order_item (id),
    notes                   varchar(300),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create index idx_stock_unit_variant on stock_unit (product_variant_id);
create index idx_stock_unit_store on stock_unit (current_store_id);
create index idx_stock_unit_availability on stock_unit (availability_status);

-- Immutable ledger row per physical/location change; exactly one of stock_unit_id / component_stock_id is set.
create table stock_movement (
    id                  uuid primary key,
    movement_type       varchar(30) not null,
    stock_unit_id       uuid references stock_unit (id),
    component_stock_id  uuid references component_stock (id),
    quantity            int         not null default 1,
    from_store_id       uuid references store (id),
    to_store_id         uuid references store (id),
    from_location_type  varchar(30),
    to_location_type     varchar(30),
    reference_type      varchar(60),
    reference_id        uuid,
    notes               varchar(300),
    occurred_at         timestamptz not null default now(),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    created_by          uuid,
    updated_by          uuid,
    constraint chk_stock_movement_subject check (
        (stock_unit_id is not null and component_stock_id is null)
        or (stock_unit_id is null and component_stock_id is not null)
    )
);

create index idx_stock_movement_stock_unit on stock_movement (stock_unit_id);
create index idx_stock_movement_component_stock on stock_movement (component_stock_id);
create index idx_stock_movement_reference on stock_movement (reference_type, reference_id);

-- Permanent association between an SO item and exact physical Stock Units (README 7.2). Not hard-deleted;
-- a damaged/unusable allocation is released (released_at set) and replaced by a new row, preserving history.
create table sales_order_item_stock_unit (
    id                  uuid primary key,
    sales_order_item_id uuid        not null references sales_order_item (id),
    stock_unit_id       uuid        not null references stock_unit (id),
    allocated_at        timestamptz not null default now(),
    released_at         timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    created_by          uuid,
    updated_by          uuid
);

create unique index uq_soi_stock_unit_active on sales_order_item_stock_unit (stock_unit_id) where released_at is null;

insert into permission (id, code, description) values
    (gen_random_uuid(), 'INVENTORY_MANAGE', 'Receive/transfer/adjust stock units and component stock, allocate to SO items');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code = 'INVENTORY_MANAGE';
