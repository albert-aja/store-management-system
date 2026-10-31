-- V20__security_audit_log.sql
-- Targeted security audit log capturing critical financial operations, price overrides, cash discrepancies, and scrap write-offs (README Section 20.9 / 21)

CREATE TABLE security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(60) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(120),
    store_id UUID,
    reference_type VARCHAR(60) NOT NULL,
    reference_id UUID,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    description VARCHAR(500) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_sec_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_sec_audit_store_id ON security_audit_log(store_id);
CREATE INDEX idx_sec_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_sec_audit_reference ON security_audit_log(reference_type, reference_id);

