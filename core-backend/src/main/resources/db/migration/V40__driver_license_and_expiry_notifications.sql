-- Migration V40: Driver License Management and Expiry Notifications
-- Allows delivery and fleet drivers to register their driving licenses (SIM A, SIM B1, SIM B1 Umum, SIM B2, SIM B2 Umum, SIM C)
-- Enables automated expiry monitoring and proactive notification dispatch before license expiration.

CREATE TABLE IF NOT EXISTS driver_license (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    license_type VARCHAR(30) NOT NULL, -- SIM_A, SIM_B1, SIM_B1_UMUM, SIM_B2, SIM_B2_UMUM, SIM_C
    issue_date DATE,
    expiry_date DATE NOT NULL,
    issuing_police_office VARCHAR(150),
    photo_url VARCHAR(500),
    notes VARCHAR(500),
    last_notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_driver_license_employee_type UNIQUE (employee_id, license_type)
);

CREATE INDEX IF NOT EXISTS idx_driver_license_employee_id ON driver_license(employee_id);
CREATE INDEX IF NOT EXISTS idx_driver_license_expiry_date ON driver_license(expiry_date);
CREATE INDEX IF NOT EXISTS idx_driver_license_type ON driver_license(license_type);

