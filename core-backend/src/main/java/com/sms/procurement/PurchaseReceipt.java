package com.sms.procurement;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One receiving document against an ISSUED PO. Multiple receipts per PO are supported (README 10.2). */
@Entity
@Table(name = "purchase_receipt")
@Getter
@Setter
@NoArgsConstructor
public class PurchaseReceipt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PurchaseReceiptStatus status = PurchaseReceiptStatus.DRAFT;

    /** Set when the receipt is finalized and inventory records are created. */
    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(length = 300)
    private String notes;
}
