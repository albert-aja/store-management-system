package com.sms.procurement;

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
@Table(name = "supplier_contact")
@Getter
@Setter
@NoArgsConstructor
public class SupplierContact extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

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
