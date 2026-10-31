package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customer_wishlist_item")
@Getter
@Setter
@NoArgsConstructor
public class CustomerWishlistItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private StorefrontCustomer customer;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "added_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal addedPrice = BigDecimal.ZERO;

    @Column(name = "current_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal currentPrice = BigDecimal.ZERO;

    @Column(length = 255)
    private String notes;

    @Column(name = "notify_on_price_drop", nullable = false)
    private boolean notifyOnPriceDrop = true;
}
