-- Procurement (slice 2): Receiving and Supplier Payments.
-- README 10.2: one PO can have multiple receiving documents and partial receipts.
--   Every incoming item is inspected; incorrect/damaged items are rejected (never become inventory).
--   Approved receiving creates Stock Movements (and Stock Units for variants, increments ComponentStock for components).
-- README 10.3: supplier payments are cash-only (later design); receiving and payment status are independent.
--   Retain supplier, PO/payable context, amount, date, payer, method/status, notes.

create table purchase_receipt (
    id                uuid primary key,
    purchase_order_id uuid        not null references purchase_order (id),
    status            varchar(30) not null default 'DRAFT',  -- DRAFT | FINALIZED
    received_at       timestamptz,
    notes             varchar(300),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    created_by        uuid,
    updated_by        uuid
);

create index idx_purchase_receipt_po on purchase_receipt (purchase_order_id);

-- One row per PO item. accepted_quantity + rejected_quantity <= po_item.quantity (partial acceptance).
-- rejected_reason is recorded for the audit trail.
create table purchase_receipt_item (
    id                     uuid primary key,
    purchase_receipt_id    uuid        not null references purchase_receipt (id),
    purchase_order_item_id uuid        not null references purchase_order_item (id),
    accepted_quantity      int         not null default 0,
    rejected_quantity      int         not null default 0,
    rejected_reason        varchar(300),
    notes                  varchar(300),
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now(),
    created_by             uuid,
    updated_by             uuid,
    constraint chk_receipt_item_accepted check (accepted_quantity >= 0),
    constraint chk_receipt_item_rejected check (rejected_quantity >= 0),
    constraint chk_receipt_item_sum_pos  check (accepted_quantity + rejected_quantity > 0),
    unique (purchase_receipt_id, purchase_order_item_id)
);

-- Supplier payments are cash-only (README 10.3 later design direction).
-- amount covers the full or partial payment against the PO.
create table supplier_payment (
    id                uuid primary key,
    purchase_order_id uuid          not null references purchase_order (id),
    amount            numeric(14,2) not null,
    paid_at           timestamptz   not null default now(),
    payer_id          uuid,          -- employee who recorded/authorised the payment
    notes             varchar(300),
    created_at        timestamptz   not null default now(),
    updated_at        timestamptz   not null default now(),
    created_by        uuid,
    updated_by        uuid,
    constraint chk_supplier_payment_amount check (amount > 0)
);

create index idx_supplier_payment_po on supplier_payment (purchase_order_id);
