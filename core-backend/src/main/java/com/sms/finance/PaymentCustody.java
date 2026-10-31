package com.sms.finance;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tracks custody of cash collected by collectors/drivers before handover to cashier.
 * Preserves accountability and discrepancy evidence per README 12.4.
 */
@Entity
@Table(name = "payment_custody")
@Getter
@Setter
@NoArgsConstructor
public class PaymentCustody extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_payment_id")
    private CustomerPayment customerPayment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "holder_employee_id")
    private Employee holderEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handover_to_employee_id")
    private Employee handoverToEmployee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CustodyStatus status = CustodyStatus.HELD_BY_COLLECTOR;

    @Column(name = "expected_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal expectedAmount;

    @Column(name = "received_amount", precision = 15, scale = 2)
    private BigDecimal receivedAmount;

    @Column(name = "discrepancy_amount", precision = 15, scale = 2)
    private BigDecimal discrepancyAmount;

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt = Instant.now();

    @Column(name = "handed_over_at")
    private Instant handedOverAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "discrepancy_notes", columnDefinition = "TEXT")
    private String discrepancyNotes;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
