-- V43__wishlist_price_drop_alerts.sql
-- Automated Push & Email Alert on Wishlist Price Drop (P.26)
-- Configurable price drop percentage threshold per wishlisted item and alert dispatch audit logs

ALTER TABLE customer_wishlist_item
    ADD COLUMN IF NOT EXISTS alert_drop_threshold_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    ADD COLUMN IF NOT EXISTS last_alerted_price NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS wishlist_price_drop_alert_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_item_id UUID REFERENCES customer_wishlist_item(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES storefront_customer(id) ON DELETE CASCADE,
    product_id UUID REFERENCES product(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES product_variant(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    original_added_price NUMERIC(14, 2) NOT NULL,
    previous_alerted_price NUMERIC(14, 2),
    current_price NUMERIC(14, 2) NOT NULL,
    price_drop_amount NUMERIC(14, 2) NOT NULL,
    drop_percentage NUMERIC(5, 2) NOT NULL,
    threshold_percentage NUMERIC(5, 2) NOT NULL,
    push_notified BOOLEAN NOT NULL DEFAULT FALSE,
    email_notified BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_email VARCHAR(150),
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_alert_log_cust ON wishlist_price_drop_alert_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_alert_log_item ON wishlist_price_drop_alert_log(wishlist_item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_alert_log_time ON wishlist_price_drop_alert_log(dispatched_at DESC);

