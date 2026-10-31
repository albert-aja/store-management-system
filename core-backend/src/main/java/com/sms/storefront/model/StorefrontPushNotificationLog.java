package com.sms.storefront.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "storefront_push_notification_log")
@Getter
@Setter
public class StorefrontPushNotificationLog {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private StorefrontCustomer customer;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "milestone_type", nullable = false, length = 50)
    private String milestoneType; // DEPOSIT_CONFIRMED, PO_PLACED, DRIVER_EN_ROUTE, STORE_PICKUP_READY

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "payload_data", columnDefinition = "TEXT")
    private String payloadData;

    @Column(nullable = false, length = 20)
    private String status = "SENT"; // SENT, DELIVERED, FAILED

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (sentAt == null) {
            sentAt = Instant.now();
        }
    }
}

