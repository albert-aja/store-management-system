-- V26: Storefront Mobile Push Notification Engine (FCM / APNs)
-- Supporting real-time order lifecycle milestones

CREATE TABLE customer_device_token (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES storefront_customer(id) ON DELETE CASCADE,
    device_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL, -- ANDROID, IOS, WEB
    device_model VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_token_customer ON customer_device_token(customer_id);
CREATE INDEX idx_device_token_val ON customer_device_token(device_token);

CREATE TABLE storefront_push_notification_log (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) REFERENCES storefront_customer(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    milestone_type VARCHAR(50) NOT NULL, -- DEPOSIT_CONFIRMED, PO_PLACED, DRIVER_EN_ROUTE, STORE_PICKUP_READY
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    payload_data TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT', -- SENT, DELIVERED, FAILED
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_log_customer_read ON storefront_push_notification_log(customer_id, is_read);
CREATE INDEX idx_push_log_order_number ON storefront_push_notification_log(order_number);

