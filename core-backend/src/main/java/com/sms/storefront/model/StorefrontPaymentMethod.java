package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "storefront_payment_method")
@Getter
@Setter
@NoArgsConstructor
public class StorefrontPaymentMethod extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String category; // DIGITAL, CASH, CREDIT, FINANCING

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String icon;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "requires_approval", nullable = false)
    private boolean requiresApproval = false;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;
}

