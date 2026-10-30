package com.sms.common.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "security_audit_log")
@Getter
@Setter
@NoArgsConstructor
public class SecurityAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_name", length = 120)
    private String actorName;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "reference_type", nullable = false, length = 60)
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(nullable = false, length = 20)
    private String severity = "INFO";

    @Column(nullable = false, length = 500)
    private String description;

    @Column(columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

