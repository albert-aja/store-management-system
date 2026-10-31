-- Add base_price (Harga Dasar - HD) and down_payment (DP) to store_product_price
alter table store_product_price
    add column if not exists base_price numeric(14, 2),
    add column if not exists down_payment numeric(14, 2) not null default 0.00;

-- Backfill base_price with existing cash_price where base_price is null
update store_product_price
set base_price = cash_price
where base_price is null;

-- Add monthly_installment to store_product_payment_plan for fast display/reporting
alter table store_product_payment_plan
    add column if not exists monthly_installment numeric(14, 2);

-- Backfill monthly_installment from total_price / term_months
update store_product_payment_plan
set monthly_installment = round(total_price / term_months, 0)
where monthly_installment is null and term_months > 0;
