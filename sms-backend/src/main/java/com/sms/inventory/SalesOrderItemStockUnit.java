package com.sms.inventory;

import com.sms.common.audit.BaseEntity;
import com.sms.sales.SalesOrderItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Permanent allocation record (README 7.2); released_at marks a replaced/cancelled allocation without deleting it. */
@Entity
@Table(name = "sales_order_item_stock_unit")
@Getter
@Setter
@NoArgsConstructor
public class SalesOrderItemStockUnit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_item_id")
    private SalesOrderItem salesOrderItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_unit_id")
    private StockUnit stockUnit;

    @Column(name = "allocated_at", nullable = false)
    private Instant allocatedAt = Instant.now();

    @Column(name = "released_at")
    private Instant releasedAt;
}
