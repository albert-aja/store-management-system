package com.sms.sales;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
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
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sales_order")
@Getter
@Setter
@NoArgsConstructor
public class SalesOrder extends BaseEntity {

    @Column(unique = true, length = 60)
    private String number;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesperson_employee_id")
    private Employee salesperson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_address_id")
    private CustomerAddress deliveryAddress;

    @Column(name = "delivery_address_snapshot", length = 300)
    private String deliveryAddressSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SalesOrderStatus status = SalesOrderStatus.DRAFT;

    @Column(name = "requires_price_approval", nullable = false)
    private boolean requiresPriceApproval = false;

    @Column(name = "approval_request_id")
    private UUID approvalRequestId;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", length = 300)
    private String cancelReason;

    @Column(name = "order_source", length = 30, nullable = false)
    private String orderSource = "EMPLOYEE"; // EMPLOYEE, ONLINE_WEB, ONLINE_APP

    @Column(name = "fulfillment_preference", length = 30, nullable = false)
    private String fulfillmentPreference = "COMPLETE"; // COMPLETE, PARTIAL

    @Column(name = "required_deposit_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal requiredDepositAmount = BigDecimal.ZERO;

    @Column(name = "deposit_paid", nullable = false)
    private boolean depositPaid = false;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "total_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "order_discount_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal orderDiscountAmount = BigDecimal.ZERO;

    @Column(name = "customer_notes", length = 500)
    private String customerNotes;
}
