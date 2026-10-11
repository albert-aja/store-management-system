-- Product catalog: Product (family/model) -> Product Variant (sellable config) -> Product Component
-- (standard expected content). Component Stock (loose spare quantity) is deferred to the Inventory
-- module, since it is inherently stock_movement-ledger-backed (README 6.2/6.5).
-- None of these rows are ever physically deleted; `active` represents discontinued/inactive state.

create sequence product_code_seq start with 1;

create table product (
    id          uuid primary key,
    code        varchar(20)  not null unique,
    name        varchar(150) not null,
    category    varchar(60),
    description varchar(500),
    active      boolean      not null default true,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table product_variant (
    id           uuid primary key,
    product_id   uuid        not null references product (id),
    code         varchar(40) not null unique,
    variant_name varchar(150) not null,
    size         varchar(60),
    color        varchar(60),
    active       boolean      not null default true,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now(),
    created_by   uuid,
    updated_by   uuid
);

create index idx_product_variant_product on product_variant (product_id);

create table product_component (
    id         uuid primary key,
    product_id uuid        not null references product (id),
    name       varchar(150) not null,
    quantity   int          not null default 1,
    notes      varchar(300),
    active     boolean      not null default true,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now(),
    created_by uuid,
    updated_by uuid
);

create index idx_product_component_product on product_component (product_id);

insert into permission (id, code, description) values
    (gen_random_uuid(), 'PRODUCT_MANAGE', 'Create/update products, variants, and components');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER', 'ADMIN')
  and p.code = 'PRODUCT_MANAGE';
