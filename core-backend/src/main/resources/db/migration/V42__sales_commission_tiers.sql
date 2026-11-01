-- V42__sales_commission_tiers.sql
-- Dynamic Showroom Floor Sales Commission Tier Configuration

CREATE TABLE commission_tier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(100) NOT NULL,
    min_sales_volume NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    max_sales_volume NUMERIC(15, 2),
    commission_rate NUMERIC(6, 4) NOT NULL,
    color_code VARCHAR(30) NOT NULL DEFAULT '#CD7F32',
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    store_id UUID REFERENCES store(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commission_tier_active_min_vol ON commission_tier(is_active, min_sales_volume ASC);
CREATE INDEX idx_commission_tier_store_id ON commission_tier(store_id);

-- Seed baseline retail showroom commission tiers (Bronze, Silver, Gold, Platinum)
INSERT INTO commission_tier (id, tier_name, min_sales_volume, max_sales_volume, commission_rate, color_code, display_order, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Bronze', 0.00, 30000000.00, 0.0100, '#CD7F32', 1, true),
    ('a0000000-0000-0000-0000-000000000002', 'Silver', 30000000.00, 60000000.00, 0.0150, '#C0C0C0', 2, true),
    ('a0000000-0000-0000-0000-000000000003', 'Gold', 60000000.00, 100000000.00, 0.0200, '#FFD700', 3, true),
    ('a0000000-0000-0000-0000-000000000004', 'Platinum', 100000000.00, NULL, 0.0250, '#7986CB', 4, true);
