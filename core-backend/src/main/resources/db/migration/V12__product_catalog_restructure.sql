-- Product catalog restructure (aligns the DB with the revised Product entities):
--   Type -> Category -> Product, Product -> Brand, Variant identified by SKU (size/color dropped; any
--   such differentiation now lives in the variant name / future attributes).
-- Existing free-text product.category values are migrated into product_category rows under a
-- 'General' type so no data is lost.

create table product_type (
    id          uuid primary key,
    type        varchar(150) not null,
    active      boolean      not null default true,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table product_category (
    id          uuid primary key,
    code        varchar(50)  not null,
    name        varchar(150) not null,
    description varchar(500),
    type_id     uuid references product_type (id),
    active      boolean      not null default true,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table product_brand (
    id          uuid primary key,
    code        varchar(50)  not null,
    name        varchar(150) not null,
    description varchar(500),
    active      boolean      not null default true,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    created_by  uuid,
    updated_by  uuid
);

create table product_attribute (
    id           uuid primary key,
    name         varchar(40)  not null unique,
    variant_name varchar(150) not null,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now(),
    created_by   uuid,
    updated_by   uuid
);

alter table product add column category_id uuid references product_category (id);
alter table product add column product_brand_id uuid references product_brand (id);

insert into product_type (id, type) select gen_random_uuid(), 'General'
where exists (select 1 from product where category is not null);

insert into product_category (id, code, name, type_id)
select gen_random_uuid(), upper(left(regexp_replace(c.category, '\s+', '_', 'g'), 50)), c.category,
       (select id from product_type where type = 'General')
from (select distinct category from product where category is not null and category <> '') c;

update product p set category_id = pc.id
from product_category pc
where p.category is not null and pc.name = p.category;

alter table product drop column category;

alter table product_variant rename column code to sku;
alter table product_variant drop column size;
alter table product_variant drop column color;

create index idx_product_category on product (category_id);
create index idx_product_brand on product (product_brand_id);
