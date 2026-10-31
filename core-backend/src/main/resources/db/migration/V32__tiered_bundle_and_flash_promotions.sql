ALTER TABLE price_discount
    ADD COLUMN IF NOT EXISTS discount_scope VARCHAR(30) NOT NULL DEFAULT 'UNIT',
    ADD COLUMN IF NOT EXISTS flash_sale BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE sales_order
    ADD COLUMN IF NOT EXISTS order_discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS price_discount_requirement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_discount_id UUID NOT NULL REFERENCES price_discount(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
    required_quantity INT NOT NULL CHECK (required_quantity > 0),
    CONSTRAINT uq_price_discount_requirement_variant UNIQUE (price_discount_id, product_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_price_discount_requirement_discount
    ON price_discount_requirement(price_discount_id);