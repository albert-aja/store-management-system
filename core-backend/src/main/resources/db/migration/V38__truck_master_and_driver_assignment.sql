-- Migration: V38__truck_master_and_driver_assignment.sql
-- Module: Truck Master Data, 1-to-1 Driver Assignment, STNK 1-Month Tax Due Date & License Plate Change History

-- 1. Extend vehicle table with driver assignment (one-to-one) and annual tax due date
ALTER TABLE vehicle
    ADD COLUMN IF NOT EXISTS driver_employee_id UUID UNIQUE REFERENCES employee (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS tax_due_date DATE;

CREATE INDEX IF NOT EXISTS idx_vehicle_driver ON vehicle (driver_employee_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tax_due ON vehicle (tax_due_date);

-- 2. Audit table for license plate changes
CREATE TABLE IF NOT EXISTS vehicle_plate_history (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id              UUID NOT NULL REFERENCES vehicle (id) ON DELETE CASCADE,
    old_registration_number VARCHAR(30) NOT NULL,
    new_registration_number VARCHAR(30) NOT NULL,
    change_date             DATE NOT NULL,
    reason                  VARCHAR(100) NOT NULL,
    notes                   TEXT,
    changed_by_employee_id  UUID REFERENCES employee (id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              UUID,
    updated_by              UUID
);

CREATE INDEX IF NOT EXISTS idx_vph_vehicle ON vehicle_plate_history (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vph_date ON vehicle_plate_history (change_date);

