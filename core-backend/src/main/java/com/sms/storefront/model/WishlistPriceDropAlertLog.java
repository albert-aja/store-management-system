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
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wishlist_price_drop_alert_log")
@Getter
@Setter
@NoArgsConstructor
public class WishlistPriceDropAlertLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wishlist_item_id")
    private CustomerWishlistItem wishlistItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private StorefrontCustomer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "original_added_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal originalAddedPrice;

    @Column(name = "previous_alerted_price", precision = 14, scale = 2)
    private BigDecimal previousAlertedPrice;

    @Column(name = "current_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "price_drop_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal priceDropAmount;

    @Column(name = "drop_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal dropPercentage;

    @Column(name = "threshold_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal thresholdPercentage;

    @Column(name = "push_notified", nullable = false)
    private boolean pushNotified = false;

    @Column(name = "email_notified", nullable = false)
    private boolean emailNotified = false;

    @Column(name = "recipient_email", length = 150)
    private String recipientEmail;

    @Column(name = "dispatched_at", nullable = false)
    private Instant dispatchedAt = Instant.now();
}

