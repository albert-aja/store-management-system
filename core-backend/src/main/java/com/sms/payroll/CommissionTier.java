package com.sms.payroll;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "commission_tier")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommissionTier extends BaseEntity {

    @Column(name = "tier_name", nullable = false, length = 100)
    private String tierName;

    @Column(name = "min_sales_volume", nullable = false, precision = 15, scale = 2)
    private BigDecimal minSalesVolume;

    @Column(name = "max_sales_volume", precision = 15, scale = 2)
    private BigDecimal maxSalesVolume;

    @Column(name = "commission_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal commissionRate;

    @Column(name = "color_code", nullable = false, length = 30)
    @Builder.Default
    private String colorCode = "#CD7F32";

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;
}
