package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
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
@Table(name = "storefront_customer")
@Getter
@Setter
@NoArgsConstructor
public class StorefrontCustomer extends BaseEntity {

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(unique = true, length = 50)
    private String phone;

    @Column(name = "password_hash", length = 200)
    private String passwordHash;

    @Column(name = "auth_user_id", unique = true)
    private java.util.UUID authUserId;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
