package com.sms.repossession;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.store.Store;
import com.sms.inventory.StockUnit;
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

/**
 * Permanent scrap disposal and salvage exit from inventory (README 13.5).
 */
@Entity
@Table(name = "stock_disposal")
@Getter
@Setter
@NoArgsConstructor
public class StockDisposal extends BaseEntity {

    @Column(name = "disposal_number", nullable = false, unique = true, length = 50)
    private String disposalNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_unit_id")
    private StockUnit stockUnit;

    @Column(nullable = false, length = 50)
    private String reason;

    @Column(name = "buyer_name", length = 150)
    private String buyerName;

    @Column(name = "scrap_proceeds", nullable = false, precision = 15, scale = 2)
    private BigDecimal scrapProceeds = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "authorized_by_id")
    private Employee authorizedBy;

    @Column(name = "disposed_at", nullable = false)
    private Instant disposedAt = Instant.now();

    @Column(columnDefinition = "TEXT")
    private String notes;
}
