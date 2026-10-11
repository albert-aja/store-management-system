package com.sms.product.dto;

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

/** Standard content expected with a product (e.g. remote, cable) — catalog definition, not inventory quantity (README 6.2). */
@Entity
@Table(name = "product_component")
@Getter
@Setter
@NoArgsConstructor
public class ProductComponent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(length = 300)
    private String notes;

    @Column(nullable = false)
    private boolean active = true;
}
