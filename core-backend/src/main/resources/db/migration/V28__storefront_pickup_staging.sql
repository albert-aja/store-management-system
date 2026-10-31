-- V28__storefront_pickup_staging.sql
-- Customer store pickup fulfillment module: in-store staging tracking & handover verification

ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS staging_rack_location VARCHAR(100);
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS pickup_pass_code VARCHAR(50);
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS pickup_qr_payload TEXT;
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS staged_at TIMESTAMPTZ;
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS staged_by_staff_name VARCHAR(150);
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS handed_over_at TIMESTAMPTZ;
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS handed_over_by_staff_name VARCHAR(150);
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS handover_recipient_name VARCHAR(150);
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS handover_recipient_phone VARCHAR(50);
ALTER TABLE fulfillment_group ADD COLUMN IF NOT EXISTS handover_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_fulfillment_group_pickup_pass ON fulfillment_group(pickup_pass_code);

