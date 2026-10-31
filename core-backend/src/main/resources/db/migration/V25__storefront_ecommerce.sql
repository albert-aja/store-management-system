-- V25: E-commerce Storefront, Multi-Fulfillment Grouping & Configurable Payment Methods

-- 1. Extend sales_order for multi-channel sales and fulfillment preferences
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS order_source VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE';
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS fulfillment_preference VARCHAR(30) NOT NULL DEFAULT 'COMPLETE';
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS required_deposit_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00;
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS total_amount NUMERIC(14,2) NOT NULL DEFAULT 0.00;
ALTER TABLE sales_order ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- 2. Multi-Fulfillment Groups (1 Sales Order : N Fulfillment Groups)
CREATE TABLE IF NOT EXISTS fulfillment_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES sales_order(id) ON DELETE CASCADE,
    group_number INT NOT NULL,
    fulfillment_method VARCHAR(30) NOT NULL DEFAULT 'DELIVERY', -- 'DELIVERY' or 'PICKUP'
    pickup_store_id UUID REFERENCES store(id),
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    tracking_number VARCHAR(60),
    estimated_delivery_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_group_order ON fulfillment_group(sales_order_id);

-- 3. Fulfillment Group Items
CREATE TABLE IF NOT EXISTS fulfillment_group_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_group_id UUID NOT NULL REFERENCES fulfillment_group(id) ON DELETE CASCADE,
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_item(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    is_procurement_required BOOLEAN NOT NULL DEFAULT FALSE,
    procurement_status VARCHAR(40) DEFAULT 'NONE', -- 'NONE', 'AWAITING_DEPOSIT', 'PO_DRAFTED', 'RECEIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_item_group ON fulfillment_group_item(fulfillment_group_id);

-- 4. Storefront Customer Accounts (Self-service online customers)
CREATE TABLE IF NOT EXISTS storefront_customer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    customer_id UUID REFERENCES customer(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Storefront Customer Saved Addresses
CREATE TABLE IF NOT EXISTS storefront_address (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storefront_customer_id UUID NOT NULL REFERENCES storefront_customer(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    street_address VARCHAR(300) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    postal_code VARCHAR(20),
    notes VARCHAR(300),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storefront_address_cust ON storefront_address(storefront_customer_id);

-- 6. Configurable Payment Methods Registry (The 9 Omnichannel Methods)
CREATE TABLE IF NOT EXISTS storefront_payment_method (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'DIGITAL', 'CASH', 'CREDIT', 'FINANCING'
    description TEXT,
    icon VARCHAR(50),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 9 Payment Methods
INSERT INTO storefront_payment_method (code, name, category, description, icon, is_enabled, requires_approval, display_order)
VALUES
('BANK_TRANSFER_VA', 'Virtual Account Bank Transfer', 'DIGITAL', 'Instant automatic verification via BCA, Mandiri, BRI, BNI Virtual Account', 'landmark', true, false, 1),
('QRIS', 'QRIS Dynamic QR', 'DIGITAL', 'Scan with any Indonesian e-wallet or banking app (GoPay, OVO, Dana, BCA Mobile)', 'qr-code', true, false, 2),
('E_WALLET', 'E-Wallet (GoPay / OVO / ShopeePay)', 'DIGITAL', 'Direct deep-link integration with popular e-wallets', 'wallet', true, false, 3),
('CREDIT_CARD', 'Credit / Debit Card', 'DIGITAL', 'Visa, Mastercard, JCB with 3D-Secure 2FA protection', 'credit-card', true, false, 4),
('CASH_STORE', 'Cash at Store Showroom', 'CASH', 'Pay directly with cash at the store cashier counter upon arrival', 'banknote', true, false, 5),
('DIRECT_STORE_TRANSFER', 'Direct Store Bank Transfer', 'CASH', 'Direct transfer to official store corporate bank account with receipt upload', 'building-2', true, false, 6),
('COD_DRIVER', 'Cash on Delivery (Driver Collection)', 'CASH', 'Pay cash directly to our delivery driver upon product arrival at your door', 'truck', true, false, 7),
('IN_HOUSE_CREDIT', 'In-House Customer Credit Facility', 'CREDIT', 'Store-financed credit installments (requires prior credit survey approval & limit verification)', 'file-text', true, true, 8),
('THIRD_PARTY_FINANCING', 'Third-Party Financing (Kredivo / Akulaku)', 'FINANCING', 'Instant pay-later & installment financing via licensed fintech partners', 'shield-check', true, false, 9)
ON CONFLICT (code) DO NOTHING;

-- 7. Persistent Shopping Cart for Web & Mobile
CREATE TABLE IF NOT EXISTS customer_cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customer(id),
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_cart_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES customer_cart(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variant(id),
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_item_cart ON customer_cart_item(cart_id);

