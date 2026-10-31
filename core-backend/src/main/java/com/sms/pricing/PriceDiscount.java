package com.sms.pricing;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "price_discount")
@Getter
@Setter
@NoArgsConstructor
public class PriceDiscount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "discount_name", nullable = false, length = 150)
    private String discountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 30)
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_scope", nullable = false, length = 30)
    private DiscountScope discountScope = DiscountScope.UNIT;

    @Column(name = "discount_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "min_order_amount", precision = 14, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "max_discount_amount", precision = 14, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_quantity", nullable = false)
    private int minQuantity = 1;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom = Instant.now();

    @Column(name = "valid_until", nullable = false)
    private Instant validUntil;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "flash_sale", nullable = false)
    private boolean flashSale;

    @Column(nullable = false)
    private int priority = 0;

    @Column(length = 300)
    private String notes;

    @OneToMany(mappedBy = "priceDiscount", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PriceDiscountRequirement> requirements = new ArrayList<>();
}

