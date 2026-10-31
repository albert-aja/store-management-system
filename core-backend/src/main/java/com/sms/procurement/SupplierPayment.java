package com.sms.procurement;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cash payment to supplier against a PO (README 10.3).
 * Receiving and payment status are independent — a PO may be partially received and fully paid, or vice versa.
 */
@Entity
@Table(name = "supplier_payment")
@Getter
@Setter
@NoArgsConstructor
public class SupplierPayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "paid_at", nullable = false)
    private Instant paidAt;

    /** Employee who recorded / authorised the cash payment. */
    @Column(name = "payer_id")
    private UUID payerId;

    @Column(length = 300)
    private String notes;
}
