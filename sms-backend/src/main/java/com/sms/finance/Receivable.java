package com.sms.finance;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
import com.sms.foundation.store.Store;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Total customer obligation for a sales order or sales order item.
 * Preserves historical financial truth per README 12.1.
 */
@Entity
@Table(name = "receivable")
@Getter
@Setter
@NoArgsConstructor
public class Receivable extends BaseEntity {

    @Column(name = "receivable_number", nullable = false, unique = true, length = 50)
    private String receivableNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_item_id")
    private SalesOrderItem salesOrderItem;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "down_payment_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal downPaymentAmount = BigDecimal.ZERO;

    @Column(name = "financed_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal financedAmount;

    @Column(name = "total_paid", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPaid = BigDecimal.ZERO;

    @Column(name = "remaining_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingBalance;

    @Column(name = "payment_term_months", nullable = false)
    private int paymentTermMonths = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReceivableStatus status = ReceivableStatus.ACTIVE;

    @Column(name = "first_due_date")
    private LocalDate firstDueDate;

    @OneToMany(mappedBy = "receivable", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReceivableInstallment> installments = new ArrayList<>();
}
