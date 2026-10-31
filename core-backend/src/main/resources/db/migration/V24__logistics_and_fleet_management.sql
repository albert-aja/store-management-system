-- Module: Logistics & Fleet Management System (Group 18 / Backlog [Q.1-Q.12])
-- Schema for Vehicles, Break Schedules, Task-Bounded Tracking Sessions, Coordinates & Privacy Audit Trail

CREATE TABLE vehicle (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id             UUID REFERENCES store (id),
    registration_number  VARCHAR(30) NOT NULL UNIQUE,
    vehicle_type         VARCHAR(50) NOT NULL,
    brand_model          VARCHAR(100) NOT NULL,
    chassis_number       VARCHAR(100),
    engine_number        VARCHAR(100),
    status               VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    max_payload_kg       INT,
    max_volume_cbm       NUMERIC(6, 2),
    fuel_type            VARCHAR(50),
    odometer_km          INT DEFAULT 0,
    stnk_expiry_date     DATE,
    kir_expiry_date      DATE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_store ON vehicle (store_id);
CREATE INDEX idx_vehicle_status ON vehicle (status);
CREATE INDEX idx_vehicle_reg ON vehicle (registration_number);

CREATE TABLE break_schedule (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id       UUID REFERENCES store (id),
    name           VARCHAR(100) NOT NULL,
    employee_role  VARCHAR(50),
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_break_sched_store ON break_schedule (store_id);
CREATE INDEX idx_break_sched_active ON break_schedule (is_active);

CREATE TABLE tracking_session (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id             UUID NOT NULL REFERENCES employee (id),
    task_type               VARCHAR(50) NOT NULL,
    task_id                 UUID,
    task_code               VARCHAR(60),
    vehicle_id              UUID REFERENCES vehicle (id),
    status                  VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    start_time              TIMESTAMPTZ,
    end_time                TIMESTAMPTZ,
    total_distance_meters   NUMERIC(10, 2) DEFAULT 0,
    active_duration_seconds INT DEFAULT 0,
    paused_duration_seconds INT DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_session_emp ON tracking_session (employee_id);
CREATE INDEX idx_tracking_session_status ON tracking_session (status);
CREATE INDEX idx_tracking_session_task ON tracking_session (task_type, task_id);

CREATE TABLE tracking_session_event (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_session_id  UUID NOT NULL REFERENCES tracking_session (id) ON DELETE CASCADE,
    event_type           VARCHAR(50) NOT NULL,
    event_timestamp      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason_code          VARCHAR(100),
    notes                TEXT,
    location_latitude    NUMERIC(10, 7),
    location_longitude   NUMERIC(10, 7)
);

CREATE INDEX idx_tracking_event_session ON tracking_session_event (tracking_session_id);

CREATE TABLE tracking_location (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_session_id  UUID NOT NULL REFERENCES tracking_session (id) ON DELETE CASCADE,
    employee_id          UUID NOT NULL REFERENCES employee (id),
    latitude             NUMERIC(10, 7) NOT NULL,
    longitude            NUMERIC(10, 7) NOT NULL,
    accuracy_meters      NUMERIC(6, 2),
    speed_mps            NUMERIC(6, 2),
    heading_degrees      NUMERIC(6, 2),
    altitude_meters      NUMERIC(7, 2),
    battery_level_pct    INT,
    is_mock_provider     BOOLEAN DEFAULT false,
    recorded_at          TIMESTAMPTZ NOT NULL,
    ingested_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tracking_loc_session ON tracking_location (tracking_session_id, recorded_at);
CREATE INDEX idx_tracking_loc_emp ON tracking_location (employee_id, recorded_at);

CREATE TABLE location_access_audit_log (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_employee_id    UUID NOT NULL REFERENCES employee (id),
    target_employee_id   UUID REFERENCES employee (id),
    query_type           VARCHAR(50) NOT NULL,
    timestamp            TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address           VARCHAR(50),
    user_agent           VARCHAR(255),
    details              TEXT
);

CREATE INDEX idx_loc_audit_actor ON location_access_audit_log (actor_employee_id);
CREATE INDEX idx_loc_audit_target ON location_access_audit_log (target_employee_id);
CREATE INDEX idx_loc_audit_time ON location_access_audit_log (timestamp DESC);

