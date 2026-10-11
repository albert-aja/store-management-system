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

/** A Sales Order snapshots the delivery address text at release time; this row can still change later (README 5.3). */
@Entity
@Table(name = "customer_address")
@Getter
@Setter
@NoArgsConstructor
public class CustomerAddress extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(length = 60)
    private String label;

    @Column(name = "address_line", nullable = false, length = 300)
    private String addressLine;

    @Column(length = 300)
    private String notes;

    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;

    @Column(nullable = false)
    private boolean active = true;
}
