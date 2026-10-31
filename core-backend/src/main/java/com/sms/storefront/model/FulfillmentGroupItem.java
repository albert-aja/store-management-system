package com.sms.storefront.model;

import com.sms.common.audit.BaseEntity;
import com.sms.sales.SalesOrderItem;
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
@Table(name = "fulfillment_group_item")
@Getter
@Setter
@NoArgsConstructor
public class FulfillmentGroupItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fulfillment_group_id")
    private FulfillmentGroup fulfillmentGroup;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_item_id")
    private SalesOrderItem salesOrderItem;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "is_procurement_required", nullable = false)
    private boolean isProcurementRequired = false;

    @Column(name = "procurement_status", length = 40)
    private String procurementStatus = "NONE"; // NONE, AWAITING_DEPOSIT, PO_DRAFTED, RECEIVED
}

