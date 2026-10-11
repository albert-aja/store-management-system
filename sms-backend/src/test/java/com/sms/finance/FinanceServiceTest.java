package com.sms.finance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.finance.dto.CollectionAttemptResponse;
import com.sms.finance.dto.CreateReceivableRequest;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

    @Mock
    private ReceivableRepository receivableRepository;
    @Mock
    private ReceivableInstallmentRepository installmentRepository;
    @Mock
    private CustomerPaymentRepository paymentRepository;
    @Mock
    private PaymentAllocationRepository allocationRepository;
    @Mock
    private PaymentCustodyRepository custodyRepository;
    @Mock
    private CollectionAttemptRepository collectionAttemptRepository;
    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private DocumentNumberingService numberingService;

    @InjectMocks
    private FinanceService financeService;

    private Store store;
    private Customer customer;
    private SalesOrder salesOrder;
    private SalesOrderItem salesOrderItem;
    private Employee collector;
    private Employee cashier;

    private static <T> T withId(T entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    @BeforeEach
    void setUp() {
        store = withId(new Store(), UUID.randomUUID());
        store.setName("Main Store");
        store.setCode("ST01");

        customer = withId(new Customer(), UUID.randomUUID());
        customer.setFullName("Budi Santoso");

        salesOrder = withId(new SalesOrder(), UUID.randomUUID());
        salesOrder.setStore(store);
        salesOrder.setCustomer(customer);
        salesOrder.setNumber("SO-001");
        salesOrder.setStatus(SalesOrderStatus.CONFIRMED);

        salesOrderItem = withId(new SalesOrderItem(), UUID.randomUUID());
        salesOrderItem.setSalesOrder(salesOrder);
        salesOrderItem.setQuantity(1);
        salesOrderItem.setFinalPrice(new BigDecimal("10000000")); // 10 million IDR
        salesOrderItem.setPaymentTermMonths(10);

        collector = withId(new Employee(), UUID.randomUUID());
        collector.setFullName("Agus Collector");

        cashier = withId(new Employee(), UUID.randomUUID());
        cashier.setFullName("Dewi Cashier");
    }

    @Test
    void createReceivable_generatesScheduleReconciledToObligation() {
        CreateReceivableRequest req = new CreateReceivableRequest();
        req.setSalesOrderId(salesOrder.getId());
        req.setSalesOrderItemId(salesOrderItem.getId());
        req.setDownPaymentAmount(new BigDecimal("1000000")); // 1 million DP
        req.setFirstDueDate(LocalDate.of(2026, 11, 1));

        when(salesOrderRepository.findById(salesOrder.getId())).thenReturn(Optional.of(salesOrder));
        when(salesOrderItemRepository.findById(salesOrderItem.getId())).thenReturn(Optional.of(salesOrderItem));
        when(numberingService.nextNumber(store.getId(), "REC")).thenReturn("REC/ST01/10/2026/0001");
        when(receivableRepository.save(any(Receivable.class))).thenAnswer(invocation -> {
            Receivable r = invocation.getArgument(0);
            return withId(r, UUID.randomUUID());
        });

        ReceivableResponse resp = financeService.createReceivable(req);

        assertThat(resp.getReceivableNumber()).isEqualTo("REC/ST01/10/2026/0001");
        assertThat(resp.getTotalAmount()).isEqualByComparingTo("10000000");
        assertThat(resp.getDownPaymentAmount()).isEqualByComparingTo("1000000");
        assertThat(resp.getFinancedAmount()).isEqualByComparingTo("9000000"); // 9 million financed
        assertThat(resp.getRemainingBalance()).isEqualByComparingTo("9000000");
        assertThat(resp.getInstallments()).hasSize(10);

        // Sum of installments must match exact financed amount
        BigDecimal sumDue = resp.getInstallments().stream()
                .map(i -> i.getAmountDue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sumDue).isEqualByComparingTo("9000000");
    }

    @Test
    void recordPayment_allocatesOldestOutstandingFirst() {
        Receivable r = withId(new Receivable(), UUID.randomUUID());
        r.setStore(store);
        r.setCustomer(customer);
        r.setTotalAmount(new BigDecimal("3000000"));
        r.setFinancedAmount(new BigDecimal("3000000"));
        r.setRemainingBalance(new BigDecimal("3000000"));
        r.setTotalPaid(BigDecimal.ZERO);
        r.setStatus(ReceivableStatus.ACTIVE);

        ReceivableInstallment inst1 = withId(new ReceivableInstallment(), UUID.randomUUID());
        inst1.setReceivable(r);
        inst1.setInstallmentNumber(1);
        inst1.setDueDate(LocalDate.of(2026, 11, 1));
        inst1.setAmountDue(new BigDecimal("1000000"));
        inst1.setAmountPaid(BigDecimal.ZERO);
        inst1.setStatus(InstallmentStatus.UNPAID);

        ReceivableInstallment inst2 = withId(new ReceivableInstallment(), UUID.randomUUID());
        inst2.setReceivable(r);
        inst2.setInstallmentNumber(2);
        inst2.setDueDate(LocalDate.of(2026, 12, 1));
        inst2.setAmountDue(new BigDecimal("1000000"));
        inst2.setAmountPaid(BigDecimal.ZERO);
        inst2.setStatus(InstallmentStatus.UNPAID);

        RecordPaymentRequest req = new RecordPaymentRequest();
        req.setStoreId(store.getId());
        req.setCustomerId(customer.getId());
        req.setAmount(new BigDecimal("1500000")); // Covers inst1 and half of inst2
        req.setPaymentMethod(PaymentMethod.BANK_TRANSFER);

        when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));
        when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(numberingService.nextNumber(store.getId(), "PAY")).thenReturn("PAY/ST01/10/2026/0001");
        when(paymentRepository.save(any(CustomerPayment.class))).thenAnswer(inv -> {
            CustomerPayment p = inv.getArgument(0);
            return withId(p, UUID.randomUUID());
        });
        when(installmentRepository.findOutstandingByCustomerId(customer.getId())).thenReturn(List.of(inst1, inst2));

        CustomerPaymentResponse resp = financeService.recordPayment(req);

        assertThat(resp.getPaymentNumber()).isEqualTo("PAY/ST01/10/2026/0001");
        assertThat(inst1.getStatus()).isEqualTo(InstallmentStatus.PAID);
        assertThat(inst1.getAmountPaid()).isEqualByComparingTo("1000000");

        assertThat(inst2.getStatus()).isEqualTo(InstallmentStatus.PARTIAL);
        assertThat(inst2.getAmountPaid()).isEqualByComparingTo("500000");

        assertThat(r.getTotalPaid()).isEqualByComparingTo("1500000");
        assertThat(r.getRemainingBalance()).isEqualByComparingTo("1500000");
        assertThat(resp.getAllocations()).hasSize(2);
    }

    @Test
    void recordPayment_createsCustodyWhenCashCollectedByStaff() {
        RecordPaymentRequest req = new RecordPaymentRequest();
        req.setStoreId(store.getId());
        req.setCustomerId(customer.getId());
        req.setAmount(new BigDecimal("500000"));
        req.setPaymentMethod(PaymentMethod.CASH);
        req.setCollectedById(collector.getId());

        when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));
        when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(employeeRepository.findById(collector.getId())).thenReturn(Optional.of(collector));
        when(numberingService.nextNumber(store.getId(), "PAY")).thenReturn("PAY/ST01/10/2026/0002");
        when(paymentRepository.save(any(CustomerPayment.class))).thenAnswer(inv -> {
            CustomerPayment p = inv.getArgument(0);
            return withId(p, UUID.randomUUID());
        });
        when(installmentRepository.findOutstandingByCustomerId(customer.getId())).thenReturn(List.of());

        financeService.recordPayment(req);

        verify(custodyRepository).save(any(PaymentCustody.class));
    }

    @Test
    void handoverAndVerifyCash_tracksDiscrepancy() {
        CustomerPayment payment = withId(new CustomerPayment(), UUID.randomUUID());
        payment.setAmount(new BigDecimal("1000000"));
        payment.setPaymentNumber("PAY/001");

        PaymentCustody custody = withId(new PaymentCustody(), UUID.randomUUID());
        custody.setCustomerPayment(payment);
        custody.setHolderEmployee(collector);
        custody.setExpectedAmount(new BigDecimal("1000000"));
        custody.setStatus(CustodyStatus.HELD_BY_COLLECTOR);

        when(custodyRepository.findById(custody.getId())).thenReturn(Optional.of(custody));
        when(employeeRepository.findById(cashier.getId())).thenReturn(Optional.of(cashier));
        when(custodyRepository.save(any(PaymentCustody.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. Handover
        HandoverCashRequest handoverReq = new HandoverCashRequest();
        handoverReq.setHandoverToEmployeeId(cashier.getId());
        PaymentCustodyResponse handedOverResp = financeService.handoverCash(custody.getId(), handoverReq);

        assertThat(handedOverResp.getStatus()).isEqualTo(CustodyStatus.HANDED_OVER);
        assertThat(handedOverResp.getHandoverToEmployeeId()).isEqualTo(cashier.getId());

        // 2. Verification with short cash (discrepancy)
        VerifyCashRequest verifyReq = new VerifyCashRequest();
        verifyReq.setReceivedAmount(new BigDecimal("950000")); // 50,000 short
        verifyReq.setDiscrepancyNotes("Missing 50k from envelope");

        PaymentCustodyResponse verifiedResp = financeService.verifyCash(custody.getId(), verifyReq);

        assertThat(verifiedResp.getStatus()).isEqualTo(CustodyStatus.DISCREPANCY);
        assertThat(verifiedResp.getDiscrepancyAmount()).isEqualByComparingTo("50000");
        assertThat(verifiedResp.getDiscrepancyNotes()).isEqualTo("Missing 50k from envelope");
    }

    @Test
    void recordCollectionAttempt_retainsPromiseWithoutShiftingDueDate() {
        RecordCollectionAttemptRequest req = new RecordCollectionAttemptRequest();
        req.setStoreId(store.getId());
        req.setCustomerId(customer.getId());
        req.setAssignedEmployeeId(collector.getId());
        req.setVisitDate(LocalDate.of(2026, 10, 8));
        req.setOutcome(CollectionOutcome.PROMISED_TO_PAY);
        req.setPromisedPaymentDate(LocalDate.of(2026, 10, 15));
        req.setCustomerAddressVisited("Jl. Merdeka No. 45");
        req.setNotes("Customer will pay after salary on the 15th");

        when(storeRepository.findById(store.getId())).thenReturn(Optional.of(store));
        when(customerRepository.findById(customer.getId())).thenReturn(Optional.of(customer));
        when(employeeRepository.findById(collector.getId())).thenReturn(Optional.of(collector));
        when(collectionAttemptRepository.save(any(CollectionAttempt.class))).thenAnswer(inv -> {
            CollectionAttempt a = inv.getArgument(0);
            return withId(a, UUID.randomUUID());
        });

        CollectionAttemptResponse resp = financeService.recordCollectionAttempt(req);

        assertThat(resp.getOutcome()).isEqualTo(CollectionOutcome.PROMISED_TO_PAY);
        assertThat(resp.getPromisedPaymentDate()).isEqualTo(LocalDate.of(2026, 10, 15));
        assertThat(resp.getCustomerAddressVisited()).isEqualTo("Jl. Merdeka No. 45");
    }
}
