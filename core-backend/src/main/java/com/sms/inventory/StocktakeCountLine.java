package com.sms.inventory;

import com.sms.common.audit.BaseEntity;
import com.sms.product.dto.ProductVariant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "stocktake_count_line",
        uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "scan_code"}))
@Getter
@Setter
@NoArgsConstructor
public class StocktakeCountLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private StocktakeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_unit_id")
    private StockUnit stockUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "scan_code", nullable = false, length = 100)
    private String scanCode;

    @Column(name = "variant_name", length = 150)
    private String variantName;

    @Column(nullable = false)
    private boolean expected;

    @Column(nullable = false)
    private boolean counted;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StocktakeVariance variance;
}
