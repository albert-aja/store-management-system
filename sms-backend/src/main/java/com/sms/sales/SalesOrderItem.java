package com.sms.sales;

import com.sms.common.audit.BaseEntity;
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
@Table(name = "sales_order_item")
@Getter
@Setter
@NoArgsConstructor
public class SalesOrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "payment_term_months", nullable = false)
    private int paymentTermMonths;

    @Column(name = "reference_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal referencePrice;

    @Column(name = "final_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal finalPrice;

    @Column(length = 300)
    private String notes;
}
