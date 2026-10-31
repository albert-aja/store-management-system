package com.sms.delivery;

import com.sms.common.audit.BaseEntity;
import com.sms.inventory.SalesOrderItemStockUnit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Individual physical item in a Delivery Order, linked to the allocated Stock Unit (README 11.2).
 */
@Entity
@Table(name = "delivery_item")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "delivery_order_id")
    private DeliveryOrder deliveryOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "so_item_stock_unit_id")
    private SalesOrderItemStockUnit soItemStockUnit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryItemStatus status = DeliveryItemStatus.PENDING;

    @Column(name = "rejection_reason", length = 300)
    private String rejectionReason;

    @Column(length = 300)
    private String notes;
}
