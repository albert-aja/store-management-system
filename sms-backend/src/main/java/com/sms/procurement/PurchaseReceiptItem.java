package com.sms.procurement;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Inspection result for one PO item within a receipt.
 * acceptedQuantity + rejectedQuantity may be less than the PO item quantity (partial receipt is allowed).
 */
@Entity
@Table(name = "purchase_receipt_item")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseReceiptItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_receipt_id")
    private PurchaseReceipt purchaseReceipt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_item_id")
    private PurchaseOrderItem purchaseOrderItem;

    @Column(name = "accepted_quantity", nullable = false)
    private int acceptedQuantity;

    @Column(name = "rejected_quantity", nullable = false)
    private int rejectedQuantity;

    @Column(name = "rejected_reason", length = 300)
    private String rejectedReason;

    @Column(length = 300)
    private String notes;
}
