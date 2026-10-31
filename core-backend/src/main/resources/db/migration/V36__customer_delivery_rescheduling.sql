ALTER TABLE delivery_trip
    ADD COLUMN planned_dispatch_at TIMESTAMPTZ,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE delivery_order
    ADD COLUMN delivery_window VARCHAR(20) CHECK (delivery_window IN ('MORNING', 'AFTERNOON')),
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE delivery_reschedule_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_order_id UUID NOT NULL REFERENCES delivery_order(id),
    requester_id UUID NOT NULL REFERENCES storefront_customer(id),
    original_trip_id UUID NOT NULL REFERENCES delivery_trip(id),
    original_dispatch_at TIMESTAMPTZ NOT NULL,
    requested_date DATE NOT NULL,
    requested_window VARCHAR(20) NOT NULL CHECK (requested_window IN ('MORNING', 'AFTERNOON')),
    reason VARCHAR(300),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    decided_at TIMESTAMPTZ,
    decided_by UUID REFERENCES employee(id),
    decision_notes VARCHAR(300),
    assigned_trip_id UUID REFERENCES delivery_trip(id),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

CREATE UNIQUE INDEX delivery_reschedule_one_pending
    ON delivery_reschedule_request(delivery_order_id) WHERE status = 'PENDING';
CREATE INDEX delivery_reschedule_review_queue ON delivery_reschedule_request(status, created_at);
