-- V29__storefront_persistent_wishlist.sql
-- Cross-Platform Persistent Wishlist & Saved Items synchronized across Web and Mobile customer sessions with price drop indicators

CREATE TABLE IF NOT EXISTS customer_wishlist_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES storefront_customer(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    product_id UUID REFERENCES product(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variant(id) ON DELETE CASCADE,
    added_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    current_price NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(255),
    notify_on_price_drop BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON customer_wishlist_item(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_session ON customer_wishlist_item(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON customer_wishlist_item(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_variant ON customer_wishlist_item(product_variant_id);
