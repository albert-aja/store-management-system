package com.sms.storefront.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customer_device_token")
@Getter
@Setter
public class CustomerDeviceToken {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private StorefrontCustomer customer;

    @Column(name = "device_token", nullable = false, unique = true)
    private String deviceToken;

    @Column(nullable = false, length = 20)
    private String platform; // ANDROID, IOS, WEB

    @Column(name = "device_model", length = 100)
    private String deviceModel;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "last_active_at", nullable = false)
    private Instant lastActiveAt = Instant.now();

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
        if (lastActiveAt == null) {
            lastActiveAt = Instant.now();
        }
    }
}

