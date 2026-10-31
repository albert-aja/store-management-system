-- Store-specific pricing (README 8.3): no global product price, no universal installment formula.
-- Configured cash price + configured total per payment-plan term; mutable in place (no price
-- history/effective-dates until a proven need appears, per README's superseded-versioning decision).

create table store_product_price (
    id                  uuid primary key,
    store_id            uuid           not null references store (id),
    product_variant_id  uuid           not null references product_variant (id),
    cash_price          numeric(14, 2) not null,
    active              boolean        not null default true,
    created_at          timestamptz    not null default now(),
    updated_at          timestamptz    not null default now(),
    created_by          uuid,
    updated_by          uuid,
    unique (store_id, product_variant_id)
);

create table store_product_payment_plan (
    id                      uuid primary key,
    store_product_price_id uuid           not null references store_product_price (id),
    term_months             int            not null,
    total_price             numeric(14, 2) not null,
    active                  boolean        not null default true,
    created_at              timestamptz    not null default now(),
    updated_at              timestamptz    not null default now(),
    created_by              uuid,
    updated_by              uuid,
    unique (store_product_price_id, term_months)
);

insert into permission (id, code, description) values
    (gen_random_uuid(), 'PRICING_MANAGE', 'Create/update store-specific product prices and payment plans');

insert into role_permission (id, role_id, permission_id)
select gen_random_uuid(), r.id, p.id
from role r, permission p
where r.code in ('OWNER', 'MANAGER')
  and p.code = 'PRICING_MANAGE';
