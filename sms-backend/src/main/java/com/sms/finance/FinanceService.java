package com.sms.finance;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.finance.dto.CollectionAttemptResponse;
import com.sms.finance.dto.CreateReceivableRequest;
import com.sms.finance.dto.CustomerCreditSummaryResponse;
import com.sms.finance.dto.CustomerPaymentResponse;
import com.sms.finance.dto.HandoverCashRequest;
import com.sms.finance.dto.PaymentCustodyResponse;
import com.sms.finance.dto.ReceivableResponse;
import com.sms.finance.dto.RecordCollectionAttemptRequest;
import com.sms.finance.dto.RecordPaymentRequest;
import com.sms.finance.dto.VerifyCashRequest;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.foundation.numbering.DocumentNumberingService;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FinanceService {

    public static final String DOC_TYPE_RECEIVABLE = "REC";
    public static final String DOC_TYPE_PAYMENT = "PAY";

    private final ReceivableRepository receivableRepository;
    private final ReceivableInstallmentRepository installmentRepository;
    private final CustomerPaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final PaymentCustodyRepository custodyRepository;
    private final CollectionAttemptRepository collectionAttemptRepository;

    private final SalesOrderRepository salesOrderRepository;
    private final SalesOrderItemRepository salesOrderItemRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentNumberingService numberingService;

    // --- Receivable Creation & Lifecycle ---

    public ReceivableResponse createReceivable(CreateReceivableRequest req) {
        SalesOrder salesOrder = salesOrderRepository.findById(req.getSalesOrderId())
                .orElseThrow(() -> new NotFoundException("Sales order not found: " + req.getSalesOrderId()));

        if (salesOrder.getStatus() != SalesOrderStatus.RELEASED && salesOrder.getStatus() != SalesOrderStatus.CONFIRMED) {
            throw new BusinessRuleException("Receivable can only be created for RELEASED or CONFIRMED sales orders");
        }

        Customer customer = salesOrder.getCustomer();
        Store store = salesOrder.getStore();

        SalesOrderItem item = null;
        BigDecimal totalAmount;
        int paymentTermMonths = 0;

        if (req.getSalesOrderItemId() != null) {
            item = salesOrderItemRepository.findById(req.getSalesOrderItemId())
                    .orElseThrow(() -> new NotFoundException("Sales order item not found: " + req.getSalesOrderItemId()));
            totalAmount = item.getFinalPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            paymentTermMonths = item.getPaymentTermMonths();
        } else {
            // Aggregate entire sales order
            List<SalesOrderItem> items = salesOrderItemRepository.findBySalesOrderId(salesOrder.getId());
            totalAmount = items.stream()
                    .map(i -> i.getFinalPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            paymentTermMonths = items.stream()
                    .mapToInt(SalesOrderItem::getPaymentTermMonths)
                    .max()
                    .orElse(0);
        }

        BigDecimal downPayment = req.getDownPaymentAmount() != null ? req.getDownPaymentAmount() : BigDecimal.ZERO;
        if (downPayment.compareTo(totalAmount) > 0) {
            throw new BusinessRuleException("Down payment cannot exceed total obligation");
        }

        BigDecimal financedAmount = totalAmount.subtract(downPayment);
        LocalDate firstDueDate = req.getFirstDueDate() != null ? req.getFirstDueDate() : LocalDate.now().plusMonths(1);

        String recNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_RECEIVABLE);

        Receivable receivable = new Receivable();
        receivable.setReceivableNumber(recNumber);
        receivable.setStore(store);
        receivable.setCustomer(customer);
        receivable.setSalesOrder(salesOrder);
        receivable.setSalesOrderItem(item);
        receivable.setTotalAmount(totalAmount);
        receivable.setDownPaymentAmount(downPayment);
        receivable.setFinancedAmount(financedAmount);
        receivable.setTotalPaid(BigDecimal.ZERO);
        receivable.setRemainingBalance(financedAmount);
        receivable.setPaymentTermMonths(paymentTermMonths);
        receivable.setStatus(financedAmount.compareTo(BigDecimal.ZERO) == 0 ? ReceivableStatus.PAID_IN_FULL : ReceivableStatus.ACTIVE);
        receivable.setFirstDueDate(firstDueDate);

        // Generate Installments schedule
        List<ReceivableInstallment> schedule = new ArrayList<>();
        if (paymentTermMonths > 0 && financedAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal monthlyBase = financedAmount.divide(BigDecimal.valueOf(paymentTermMonths), 0, RoundingMode.HALF_UP);
            BigDecimal cumulative = BigDecimal.ZERO;

            for (int i = 1; i <= paymentTermMonths; i++) {
                ReceivableInstallment inst = new ReceivableInstallment();
                inst.setReceivable(receivable);
                inst.setInstallmentNumber(i);
                inst.setDueDate(firstDueDate.plusMonths(i - 1));

                if (i == paymentTermMonths) {
                    // Final installment absorbs rounding difference so exact sum matches financed amount (README 4.9)
                    inst.setAmountDue(financedAmount.subtract(cumulative));
                } else {
                    inst.setAmountDue(monthlyBase);
                    cumulative = cumulative.add(monthlyBase);
                }
                inst.setAmountPaid(BigDecimal.ZERO);
                inst.setStatus(InstallmentStatus.UNPAID);
                schedule.add(inst);
            }
        } else if (paymentTermMonths == 0 && financedAmount.compareTo(BigDecimal.ZERO) > 0) {
            // Cash / single installment
            ReceivableInstallment inst = new ReceivableInstallment();
            inst.setReceivable(receivable);
            inst.setInstallmentNumber(1);
            inst.setDueDate(firstDueDate);
            inst.setAmountDue(financedAmount);
            inst.setAmountPaid(BigDecimal.ZERO);
            inst.setStatus(InstallmentStatus.UNPAID);
            schedule.add(inst);
        }

        receivable.setInstallments(schedule);
        Receivable saved = receivableRepository.save(receivable);
        return ReceivableResponse.from(saved);
    }

    // --- Payment Recording & Allocation ---

    public CustomerPaymentResponse recordPayment(RecordPaymentRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found: " + req.getCustomerId()));

        SalesOrder salesOrder = null;
        if (req.getSalesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(req.getSalesOrderId())
                    .orElseThrow(() -> new NotFoundException("Sales order not found: " + req.getSalesOrderId()));
        }

        Employee collector = null;
        if (req.getCollectedById() != null) {
            collector = employeeRepository.findById(req.getCollectedById())
                    .orElseThrow(() -> new NotFoundException("Employee not found: " + req.getCollectedById()));
        }

        String paymentNumber = numberingService.nextNumber(store.getId(), DOC_TYPE_PAYMENT);

        CustomerPayment payment = new CustomerPayment();
        payment.setPaymentNumber(paymentNumber);
        payment.setStore(store);
        payment.setCustomer(customer);
        payment.setSalesOrder(salesOrder);
        payment.setAmount(req.getAmount());
        payment.setPaymentType(req.getPaymentType());
        payment.setPaymentMethod(req.getPaymentMethod());
        payment.setReferenceNumber(req.getReferenceNumber());
        payment.setCollectedBy(collector);
        payment.setPaidAt(Instant.now());
        payment.setNotes(req.getNotes());

        CustomerPayment savedPayment = paymentRepository.save(payment);

        // Allocation logic
        BigDecimal remainingToAllocate = req.getAmount();
        List<PaymentAllocation> allocations = new ArrayList<>();

        if (req.getSpecificInstallmentId() != null) {
            // Targeted allocation
            ReceivableInstallment target = installmentRepository.findById(req.getSpecificInstallmentId())
                    .orElseThrow(() -> new NotFoundException("Installment not found: " + req.getSpecificInstallmentId()));
            remainingToAllocate = allocateToInstallment(savedPayment, target, remainingToAllocate, allocations);
        }

        if (remainingToAllocate.compareTo(BigDecimal.ZERO) > 0) {
            // Default business rule (README 12.2 / 4.10): allocate oldest outstanding installment first
            List<ReceivableInstallment> outstanding = (salesOrder != null)
                    ? receivableRepository.findBySalesOrderId(salesOrder.getId()).stream()
                            .flatMap(r -> installmentRepository.findOutstandingByReceivableId(r.getId()).stream())
                            .toList()
                    : installmentRepository.findOutstandingByCustomerId(customer.getId());

            for (ReceivableInstallment inst : outstanding) {
                if (remainingToAllocate.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }
                remainingToAllocate = allocateToInstallment(savedPayment, inst, remainingToAllocate, allocations);
            }
        }

        // Remaining unallocated balance is saved as customer credit/unallocated cash
        savedPayment.setUnallocatedAmount(remainingToAllocate);
        savedPayment.setAllocations(allocations);
        savedPayment = paymentRepository.save(savedPayment);

        // Cash custody tracking (README 12.4)
        if (req.getPaymentMethod() == PaymentMethod.CASH && collector != null) {
            PaymentCustody custody = new PaymentCustody();
            custody.setCustomerPayment(savedPayment);
            custody.setHolderEmployee(collector);
            custody.setStatus(CustodyStatus.HELD_BY_COLLECTOR);
            custody.setExpectedAmount(savedPayment.getAmount());
            custody.setCollectedAt(Instant.now());
            custodyRepository.save(custody);
        }

        return CustomerPaymentResponse.from(savedPayment);
    }

    private BigDecimal allocateToInstallment(CustomerPayment payment, ReceivableInstallment inst, BigDecimal remaining, List<PaymentAllocation> allocations) {
        BigDecimal needed = inst.getAmountDue().subtract(inst.getAmountPaid());
        if (needed.compareTo(BigDecimal.ZERO) <= 0) {
            return remaining;
        }

        BigDecimal toAllocate = remaining.min(needed);
        PaymentAllocation allocation = new PaymentAllocation();
        allocation.setCustomerPayment(payment);
        allocation.setReceivableInstallment(inst);
        allocation.setAmount(toAllocate);
        allocation.setAllocatedAt(Instant.now());
        allocationRepository.save(allocation);
        allocations.add(allocation);

        inst.setAmountPaid(inst.getAmountPaid().add(toAllocate));
        if (inst.getAmountPaid().compareTo(inst.getAmountDue()) >= 0) {
            inst.setStatus(InstallmentStatus.PAID);
            inst.setPaidAt(Instant.now());
        } else {
            inst.setStatus(InstallmentStatus.PARTIAL);
        }
        installmentRepository.save(inst);

        Receivable r = inst.getReceivable();
        r.setTotalPaid(r.getTotalPaid().add(toAllocate));
        r.setRemainingBalance(r.getRemainingBalance().subtract(toAllocate));
        if (r.getRemainingBalance().compareTo(BigDecimal.ZERO) <= 0) {
            r.setStatus(ReceivableStatus.PAID_IN_FULL);
        }
        receivableRepository.save(r);

        return remaining.subtract(toAllocate);
    }

    // --- Cash Custody Handover & Verification ---

    public PaymentCustodyResponse handoverCash(UUID custodyId, HandoverCashRequest req) {
        PaymentCustody custody = custodyRepository.findById(custodyId)
                .orElseThrow(() -> new NotFoundException("Custody record not found: " + custodyId));

        if (custody.getStatus() != CustodyStatus.HELD_BY_COLLECTOR) {
            throw new BusinessRuleException("Cash cannot be handed over from status " + custody.getStatus());
        }

        Employee handoverTo = employeeRepository.findById(req.getHandoverToEmployeeId())
                .orElseThrow(() -> new NotFoundException("Handover recipient employee not found: " + req.getHandoverToEmployeeId()));

        custody.setHandoverToEmployee(handoverTo);
        custody.setStatus(CustodyStatus.HANDED_OVER);
        custody.setHandedOverAt(Instant.now());
        if (req.getNotes() != null) {
            custody.setNotes(req.getNotes());
        }
        PaymentCustody saved = custodyRepository.save(custody);
        return PaymentCustodyResponse.from(saved);
    }

    public PaymentCustodyResponse verifyCash(UUID custodyId, VerifyCashRequest req) {
        PaymentCustody custody = custodyRepository.findById(custodyId)
                .orElseThrow(() -> new NotFoundException("Custody record not found: " + custodyId));

        if (custody.getStatus() != CustodyStatus.HANDED_OVER && custody.getStatus() != CustodyStatus.HELD_BY_COLLECTOR) {
            throw new BusinessRuleException("Cannot verify cash in status " + custody.getStatus());
        }

        custody.setReceivedAmount(req.getReceivedAmount());
        custody.setVerifiedAt(Instant.now());

        if (req.getReceivedAmount().compareTo(custody.getExpectedAmount()) == 0) {
            custody.setStatus(CustodyStatus.VERIFIED_BY_CASHIER);
            custody.setDiscrepancyAmount(BigDecimal.ZERO);
        } else {
            custody.setStatus(CustodyStatus.DISCREPANCY);
            custody.setDiscrepancyAmount(custody.getExpectedAmount().subtract(req.getReceivedAmount()));
            custody.setDiscrepancyNotes(req.getDiscrepancyNotes());
        }

        PaymentCustody saved = custodyRepository.save(custody);
        return PaymentCustodyResponse.from(saved);
    }

    // --- Collection Attempts ---

    public CollectionAttemptResponse recordCollectionAttempt(RecordCollectionAttemptRequest req) {
        Store store = storeRepository.findById(req.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found: " + req.getStoreId()));
        Customer customer = customerRepository.findById(req.getCustomerId())
                .orElseThrow(() -> new NotFoundException("Customer not found: " + req.getCustomerId()));
        Employee employee = employeeRepository.findById(req.getAssignedEmployeeId())
                .orElseThrow(() -> new NotFoundException("Assigned employee not found: " + req.getAssignedEmployeeId()));

        Receivable receivable = null;
        if (req.getReceivableId() != null) {
            receivable = receivableRepository.findById(req.getReceivableId())
                    .orElseThrow(() -> new NotFoundException("Receivable not found: " + req.getReceivableId()));
        }

        CustomerPayment payment = null;
        if (req.getCustomerPaymentId() != null) {
            payment = paymentRepository.findById(req.getCustomerPaymentId())
                    .orElseThrow(() -> new NotFoundException("Payment not found: " + req.getCustomerPaymentId()));
        }

        CollectionAttempt attempt = new CollectionAttempt();
        attempt.setStore(store);
        attempt.setCustomer(customer);
        attempt.setReceivable(receivable);
        attempt.setAssignedEmployee(employee);
        attempt.setVisitDate(req.getVisitDate());
        attempt.setOutcome(req.getOutcome());
        attempt.setPromisedPaymentDate(req.getPromisedPaymentDate());
        attempt.setCustomerAddressVisited(req.getCustomerAddressVisited());
        attempt.setCustomerPayment(payment);
        attempt.setNotes(req.getNotes());

        CollectionAttempt saved = collectionAttemptRepository.save(attempt);
        return CollectionAttemptResponse.from(saved);
    }

    // --- Aggregated Views & Queries ---

    @Transactional(readOnly = true)
    public ReceivableResponse getReceivable(UUID id) {
        Receivable r = receivableRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Receivable not found: " + id));
        return ReceivableResponse.from(r);
    }

    @Transactional(readOnly = true)
    public List<ReceivableResponse> listReceivables(UUID storeId, UUID customerId, ReceivableStatus status) {
        return receivableRepository.search(storeId, customerId, status).stream()
                .map(ReceivableResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReceivableResponse> listReceivablesBySalesOrder(UUID salesOrderId) {
        return receivableRepository.findBySalesOrderId(salesOrderId).stream()
                .map(ReceivableResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CustomerPaymentResponse> listPayments(UUID storeId, UUID customerId) {
        return paymentRepository.search(storeId, customerId).stream()
                .map(CustomerPaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentCustodyResponse> listCustodies(UUID holderId, CustodyStatus status) {
        return custodyRepository.search(holderId, status).stream()
                .map(PaymentCustodyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CollectionAttemptResponse> listCollectionAttempts(UUID storeId, UUID customerId) {
        return collectionAttemptRepository.search(storeId, customerId).stream()
                .map(CollectionAttemptResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerCreditSummaryResponse getCustomerCreditSummary(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found: " + customerId));

        List<Receivable> receivables = receivableRepository.findByCustomerId(customerId);
        BigDecimal totalFinanced = receivables.stream().map(Receivable::getFinancedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = receivables.stream().map(Receivable::getTotalPaid).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainingBalance = receivables.stream().map(Receivable::getRemainingBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        int activeCount = (int) receivables.stream().filter(r -> r.getStatus() == ReceivableStatus.ACTIVE).count();

        List<ReceivableInstallment> outstanding = installmentRepository.findOutstandingByCustomerId(customerId);
        LocalDate today = LocalDate.now();
        List<ReceivableInstallment> overdue = outstanding.stream().filter(i -> i.getDueDate().isBefore(today)).toList();
        BigDecimal overdueAmount = overdue.stream()
                .map(i -> i.getAmountDue().subtract(i.getAmountPaid()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CustomerPayment> payments = paymentRepository.findByCustomerIdOrderByPaidAtDesc(customerId);
        BigDecimal unallocatedCredit = payments.stream().map(CustomerPayment::getUnallocatedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return CustomerCreditSummaryResponse.builder()
                .customerId(customer.getId())
                .customerName(customer.getFullName())
                .totalFinanced(totalFinanced)
                .totalPaid(totalPaid)
                .remainingBalance(remainingBalance)
                .unallocatedCredit(unallocatedCredit)
                .activeReceivablesCount(activeCount)
                .overdueInstallmentsCount(overdue.size())
                .overdueAmount(overdueAmount)
                .build();
    }
}
