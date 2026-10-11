package com.sms.repossession;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
import com.sms.finance.Receivable;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.store.Store;
import com.sms.inventory.StockUnit;
import com.sms.sales.SalesOrder;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Physical inbound return/recovery of sold products to the store (README 13.1).
 * Unifies physical movement while preserving business reason (repossession, customer return, warranty).
 */
@Entity
@Table(name = "stock_return")
@Getter
@Setter
@NoArgsConstructor
public class StockReturn extends BaseEntity {

    @Column(name = "return_number", nullable = false, unique = true, length = 50)
    private String returnNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_unit_id")
    private StockUnit stockUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receivable_id")
    private Receivable receivable;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_type", nullable = false, length = 30)
    private StockReturnType returnType = StockReturnType.REPOSSESSION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StockReturnStatus status = StockReturnStatus.INITIATED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Employee driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "helper_id")
    private Employee helper;

    @Column(name = "vehicle_plate", length = 20)
    private String vehiclePlate;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "recovered_at")
    private Instant recoveredAt;

    @Column(name = "customer_refusal_reason", columnDefinition = "TEXT")
    private String customerRefusalReason;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToOne(mappedBy = "stockReturn", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StockReturnDisposition disposition;
}
