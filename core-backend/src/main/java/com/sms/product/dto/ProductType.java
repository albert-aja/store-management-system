package com.sms.product.dto;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Catalog/family definition; permanent and non-deletable (README 6.1). */
@Entity
@Table(name = "product_type")
@Getter
@Setter
@NoArgsConstructor
public class ProductType extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String type;

    @Column(nullable = false)
    private boolean active = true;

}
