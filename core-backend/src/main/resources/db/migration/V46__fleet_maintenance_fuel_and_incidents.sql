-- V46__fleet_maintenance_fuel_and_incidents.sql
-- Backlog [L.5]: Delivery fleet vehicle maintenance scheduler, fuel consumption log tracking, and incident damage reporting.

CREATE TABLE IF NOT EXISTS vehicle_maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    target_odometer_km INT,
    estimated_cost NUMERIC(15, 2) DEFAULT 0.00,
    actual_cost NUMERIC(15, 2),
    service_center VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_vms_vehicle ON vehicle_maintenance_schedule(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vms_scheduled_date ON vehicle_maintenance_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_vms_status ON vehicle_maintenance_schedule(status);

CREATE TABLE IF NOT EXISTS vehicle_fuel_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    driver_employee_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    log_date DATE NOT NULL,
    odometer_km INT NOT NULL,
    fuel_liters NUMERIC(8, 2) NOT NULL,
    cost_per_liter NUMERIC(15, 2) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL,
    fuel_type VARCHAR(50),
    gas_station_name VARCHAR(150),
    full_tank BOOLEAN NOT NULL DEFAULT true,
    efficiency_km_per_liter NUMERIC(8, 2),
    receipt_photo_url VARCHAR(500),
    invoice_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_vfl_vehicle ON vehicle_fuel_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vfl_log_date ON vehicle_fuel_log(log_date);
CREATE INDEX IF NOT EXISTS idx_vfl_driver ON vehicle_fuel_log(driver_employee_id);

CREATE TABLE IF NOT EXISTS vehicle_incident_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    reporter_employee_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    incident_date DATE NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'LOW',
    location VARCHAR(255),
    description TEXT NOT NULL,
    third_party_involved BOOLEAN NOT NULL DEFAULT false,
    third_party_details TEXT,
    police_report_number VARCHAR(100),
    damage_photo_urls TEXT,
    estimated_repair_cost NUMERIC(15, 2) DEFAULT 0.00,
    actual_repair_cost NUMERIC(15, 2),
    insurance_claimed BOOLEAN NOT NULL DEFAULT false,
    insurance_claim_number VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_vir_vehicle ON vehicle_incident_report(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vir_incident_date ON vehicle_incident_report(incident_date);
CREATE INDEX IF NOT EXISTS idx_vir_status ON vehicle_incident_report(status);
CREATE INDEX IF NOT EXISTS idx_vir_severity ON vehicle_incident_report(severity);

