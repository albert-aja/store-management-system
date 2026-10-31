package com.sms.customer;

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
@Table(name = "customer_contact")
@Getter
@Setter
@NoArgsConstructor
public class CustomerContact extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "contact_type", nullable = false, length = 30)
    private String contactType;

    @Column(length = 60)
    private String label;

    @Column(nullable = false, length = 150)
    private String value;

    @Column(length = 300)
    private String notes;

    @Column(nullable = false)
    private boolean active = true;
}
