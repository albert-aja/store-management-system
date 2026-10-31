-- Migration: V39__truck_service_logs_and_health_checks.sql
-- Module: Truck Service Logs, Travelled Distance Calculation & Monthly Health Inspection Checklists

-- 1. Vehicle Service Log Table
CREATE TABLE IF NOT EXISTS vehicle_service_log (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id                  UUID NOT NULL REFERENCES vehicle (id) ON DELETE CASCADE,
    service_date                DATE NOT NULL,
    service_type                VARCHAR(50) NOT NULL,
    odometer_km                 INT NOT NULL,
    service_center              VARCHAR(150),
    cost_amount                 NUMERIC(15, 2) DEFAULT 0,
    invoice_number              VARCHAR(100),
    description                 TEXT,
    parts_replaced              TEXT,
    next_service_odometer_km    INT,
    performed_by_employee_id    UUID REFERENCES employee (id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  UUID,
    updated_by                  UUID
);

CREATE INDEX IF NOT EXISTS idx_vsl_vehicle ON vehicle_service_log (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vsl_date ON vehicle_service_log (service_date);

-- 2. Vehicle Monthly Health Check Table
CREATE TABLE IF NOT EXISTS vehicle_monthly_health_check (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id                      UUID NOT NULL REFERENCES vehicle (id) ON DELETE CASCADE,
    check_date                      DATE NOT NULL,
    check_month                     VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    inspector_employee_id           UUID REFERENCES employee (id) ON DELETE SET NULL,
    inspector_name                  VARCHAR(150),
    overall_rating                  VARCHAR(30) NOT NULL, -- HEALTHY, ATTENTION_NEEDED, UNFIT_FOR_ROAD
    engine_oil_status               VARCHAR(30) DEFAULT 'NORMAL', -- NORMAL, LOW, LEAKING
    radiator_coolant_status         VARCHAR(30) DEFAULT 'NORMAL', -- NORMAL, LOW, NEEDS_FLUSH
    brake_fluid_status              VARCHAR(30) DEFAULT 'NORMAL', -- NORMAL, LOW, DISCOLORED
    brake_condition                 VARCHAR(30) DEFAULT 'GOOD', -- GOOD, WORN_WARNING, REPLACEMENT_URGENT
    front_tire_condition            VARCHAR(30) DEFAULT 'GOOD', -- GOOD, WORN, DAMAGED
    rear_tire_condition             VARCHAR(30) DEFAULT 'GOOD', -- GOOD, WORN, DAMAGED
    tire_pressure_psi               INT,
    battery_condition               VARCHAR(30) DEFAULT 'GOOD', -- GOOD, WEAK, REPLACE
    headlamps_and_signals_status    VARCHAR(30) DEFAULT 'ALL_WORKING', -- ALL_WORKING, PARTIAL_DEFECT, DEFECTIVE
    horn_and_wipers_status          VARCHAR(30) DEFAULT 'WORKING', -- WORKING, DEFECTIVE
    safety_equipment_present        BOOLEAN DEFAULT true,
    apar_expiry_date                DATE,
    cargo_box_condition             VARCHAR(30) DEFAULT 'GOOD', -- GOOD, MINOR_DENT, DOOR_LATCH_ISSUE, LEAKING_ROOF
    odometer_reading_km             INT,
    notes                           TEXT,
    action_required                 TEXT,
    next_check_due_date             DATE,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                      UUID,
    updated_by                      UUID
);

CREATE INDEX IF NOT EXISTS idx_vmhc_vehicle ON vehicle_monthly_health_check (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vmhc_month ON vehicle_monthly_health_check (check_month);

