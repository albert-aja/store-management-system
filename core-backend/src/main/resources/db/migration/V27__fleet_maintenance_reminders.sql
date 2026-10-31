-- Migration: V27__fleet_maintenance_reminders.sql
-- Module: Fleet Asset Servicing & KIR/STNK Expiry Reminders (Backlog [Q.21])

ALTER TABLE vehicle
    ADD COLUMN IF NOT EXISTS last_service_odometer_km INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_service_date DATE,
    ADD COLUMN IF NOT EXISTS service_interval_km INT DEFAULT 10000;

CREATE TABLE fleet_maintenance_alert (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id           UUID NOT NULL REFERENCES vehicle (id) ON DELETE CASCADE,
    store_id             UUID REFERENCES store (id),
    alert_type           VARCHAR(50) NOT NULL, -- STNK_EXPIRING, KIR_EXPIRING, SERVICE_DUE, STNK_EXPIRED, KIR_EXPIRED
    severity             VARCHAR(30) NOT NULL, -- WARNING, CRITICAL, EXPIRED
    title                VARCHAR(150) NOT NULL,
    description          VARCHAR(255) NOT NULL,
    target_date          DATE,
    days_remaining       INT,
    is_resolved          BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fleet_alert_vehicle ON fleet_maintenance_alert (vehicle_id);
CREATE INDEX idx_fleet_alert_store ON fleet_maintenance_alert (store_id);
CREATE INDEX idx_fleet_alert_resolved ON fleet_maintenance_alert (is_resolved);
CREATE INDEX idx_fleet_alert_type ON fleet_maintenance_alert (alert_type);

