-- V30__promotional_price_discounts.sql
-- Omnichannel Promotional Price Discounts & Campaign Engine for Electronics & Furniture Retail

CREATE TABLE IF NOT EXISTS price_discount (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id            UUID REFERENCES store(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES product(id) ON DELETE CASCADE,
    product_variant_id  UUID REFERENCES product_variant(id) ON DELETE CASCADE,
    discount_name       VARCHAR(150) NOT NULL,
    discount_type       VARCHAR(30) NOT NULL DEFAULT 'PERCENTAGE', -- PERCENTAGE or FIXED_AMOUNT
    discount_value      NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    min_order_amount    NUMERIC(14,2) DEFAULT 0.00,
    max_discount_amount NUMERIC(14,2),
    min_quantity        INT NOT NULL DEFAULT 1,
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until         TIMESTAMPTZ NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    priority            INT NOT NULL DEFAULT 0,
    notes               VARCHAR(300),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          UUID,
    updated_by          UUID
);

CREATE INDEX IF NOT EXISTS idx_price_discount_store ON price_discount(store_id);
CREATE INDEX IF NOT EXISTS idx_price_discount_product ON price_discount(product_id);
CREATE INDEX IF NOT EXISTS idx_price_discount_variant ON price_discount(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_price_discount_active_dates ON price_discount(active, valid_from, valid_until);

