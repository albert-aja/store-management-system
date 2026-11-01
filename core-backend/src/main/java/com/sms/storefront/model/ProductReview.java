package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import com.sms.delivery.DeliveryOrder;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.sales.SalesOrder;
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
@Table(name = "product_review")
@Getter
@Setter
@NoArgsConstructor
public class ProductReview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private StorefrontCustomer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_order_id")
    private DeliveryOrder deliveryOrder;

    @Column(nullable = false)
    private int rating;

    @Column(length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "verified_purchase", nullable = false)
    private boolean verifiedPurchase = true;
}

