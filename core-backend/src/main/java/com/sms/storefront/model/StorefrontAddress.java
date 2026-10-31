package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "storefront_address")
@Getter
@Setter
@NoArgsConstructor
public class StorefrontAddress extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "storefront_customer_id")
    private StorefrontCustomer customer;

    @Column(nullable = false, length = 50)
    private String label = "Home";

    @Column(name = "recipient_name", nullable = false, length = 150)
    private String recipientName;

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(name = "street_address", nullable = false, length = 300)
    private String streetAddress;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String province;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 300)
    private String notes;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;
}

