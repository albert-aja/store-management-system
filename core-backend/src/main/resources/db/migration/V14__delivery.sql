-- Module 8: Delivery and Logistics
-- Trip (delivery_trip: Picking/Trip run for a store, driver, optional helper, vehicle, dispatch & completion lifecycle)
-- Delivery Order (delivery_order: 1 SO -> many Deliveries, assigned to a trip, destination snapshot, pre-inspection, COD custody, outcome)
-- Delivery Item (delivery_item: links to allocated so_item_stock_unit per README 11.2; successful delivery posts stock_movement DELIVERY)

create table delivery_trip (
    id                   uuid primary key,
    trip_number          varchar(60) not null unique,
    store_id             uuid        not null references store (id),
    driver_employee_id   uuid        not null references employee (id),
    helper_employee_id   uuid        references employee (id),
    vehicle_plate        varchar(30),
    scheduled_date       date        not null default current_date,
    status               varchar(30) not null default 'PLANNED',
    departed_at          timestamptz,
    completed_at         timestamptz,
    notes                varchar(300),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now(),
    created_by           uuid,
    updated_by           uuid
);

create index idx_delivery_trip_store on delivery_trip (store_id);
create index idx_delivery_trip_driver on delivery_trip (driver_employee_id);
create index idx_delivery_trip_status on delivery_trip (status);
create index idx_delivery_trip_date on delivery_trip (scheduled_date);

create table delivery_order (
    id                     uuid primary key,
    delivery_order_number  varchar(60) unique,
    sales_order_id         uuid        not null references sales_order (id),
    delivery_trip_id       uuid        references delivery_trip (id),
    destination_address    varchar(300) not null,
    recipient_name         varchar(100),
    recipient_phone        varchar(50),
    stop_sequence          int         not null default 1,
    status                 varchar(30) not null default 'PENDING',
    pre_inspection_passed  boolean     not null default false,
    pre_inspection_notes   varchar(300),
    delivered_at           timestamptz,
    signed_by              varchar(100),
    proof_photo_url        varchar(500),
    failure_reason         varchar(300),
    cod_amount             numeric(14, 2) not null default 0,
    cod_collected          numeric(14, 2) not null default 0,
    cod_notes              varchar(300),
    notes                  varchar(300),
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now(),
    created_by             uuid,
    updated_by             uuid
);

create index idx_delivery_order_so on delivery_order (sales_order_id);
create index idx_delivery_order_trip on delivery_order (delivery_trip_id);
create index idx_delivery_order_status on delivery_order (status);

create table delivery_item (
    id                      uuid primary key,
    delivery_order_id       uuid        not null references delivery_order (id),
    so_item_stock_unit_id   uuid        not null references sales_order_item_stock_unit (id),
    status                  varchar(30) not null default 'PENDING',
    rejection_reason        varchar(300),
    notes                   varchar(300),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    created_by              uuid,
    updated_by              uuid
);

create index idx_delivery_item_do on delivery_item (delivery_order_id);
create index idx_delivery_item_soi_su on delivery_item (so_item_stock_unit_id);

insert into permission (id, code, description) values
    (gen_random_uuid(), 'DELIVERY_MANAGE', 'Plan trips, create delivery orders, perform pre-inspection, and reconcile trips'),
    (gen_random_uuid(), 'DELIVERY_EXECUTE', 'Execute delivery trips, update delivery status, capture customer signature/proof, and record COD');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code in ('DELIVERY_MANAGE', 'DELIVERY_EXECUTE');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code = 'DRIVER'
  and p.code in ('DELIVERY_EXECUTE');
