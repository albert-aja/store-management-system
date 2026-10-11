package com.sms.pricing;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import com.sms.product.dto.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Store-specific price for one variant; mutable in place, no history until a proven need appears (README 8.3). */
@Entity
@Table(name = "store_product_price", uniqueConstraints = @UniqueConstraint(columnNames = {"store_id", "product_variant_id"}))
@Getter
@Setter
@NoArgsConstructor
public class StoreProductPrice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "cash_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal cashPrice;

    @Column(nullable = false)
    private boolean active = true;
}
