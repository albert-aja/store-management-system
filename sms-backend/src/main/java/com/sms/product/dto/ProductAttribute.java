package com.sms.product.dto;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Specific sellable configuration and stock pool (README 6.1); Stock Unit tracking arrives with the Inventory module. */
@Entity
@Table(name = "product_attribute")
@Getter
@Setter
@NoArgsConstructor
public class ProductAttribute extends BaseEntity {

    @Column(nullable = false, unique = true, length = 40)
    private String name;

    @Column(name = "variant_name", nullable = false, length = 150)
    private String variantName;
}
