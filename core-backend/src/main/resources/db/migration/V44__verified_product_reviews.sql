-- V44__verified_product_reviews.sql
-- Backlog [P.15]: Verified Customer Product Review & Rating System strictly gated by completed Sales Order delivery confirmation

CREATE TABLE IF NOT EXISTS product_review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES storefront_customer(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variant(id) ON DELETE SET NULL,
    sales_order_id UUID REFERENCES sales_order(id) ON DELETE SET NULL,
    delivery_order_id UUID REFERENCES delivery_order(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(150),
    content TEXT NOT NULL,
    verified_purchase BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uq_product_review_customer_product UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_review_product ON product_review(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_customer ON product_review(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_review_rating ON product_review(rating);

