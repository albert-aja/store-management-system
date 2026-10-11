package com.sms.finance;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.store.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Operational field visit record.
 * Per Resolved Conflict #10: distinct from financial Payment object.
 */
@Entity
@Table(name = "collection_attempt")
@Getter
@Setter
@NoArgsConstructor
public class CollectionAttempt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receivable_id")
    private Receivable receivable;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_employee_id")
    private Employee assignedEmployee;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CollectionOutcome outcome;

    @Column(name = "promised_payment_date")
    private LocalDate promisedPaymentDate;

    @Column(name = "customer_address_visited", columnDefinition = "TEXT")
    private String customerAddressVisited;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_payment_id")
    private CustomerPayment customerPayment;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
