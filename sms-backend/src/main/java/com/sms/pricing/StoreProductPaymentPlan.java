package com.sms.pricing;

import com.sms.common.audit.BaseEntity;
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

/** Configured total price for one installment term; not calculated by a universal formula (README 8.3). */
@Entity
@Table(name = "store_product_payment_plan", uniqueConstraints = @UniqueConstraint(columnNames = {"store_product_price_id", "term_months"}))
@Getter
@Setter
@NoArgsConstructor
public class StoreProductPaymentPlan extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_product_price_id")
    private StoreProductPrice storeProductPrice;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private boolean active = true;
}
