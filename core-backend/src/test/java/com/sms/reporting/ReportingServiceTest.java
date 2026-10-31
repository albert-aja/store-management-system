package com.sms.reporting;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.sms.customer.Customer;
import com.sms.expense.Expense;
import com.sms.expense.ExpenseCategory;
import com.sms.expense.ExpenseRepository;
import com.sms.finance.CustodyStatus;
import com.sms.finance.CustomerPayment;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.InstallmentStatus;
import com.sms.finance.PaymentCustody;
import com.sms.finance.PaymentCustodyRepository;
import com.sms.finance.Receivable;
import com.sms.finance.ReceivableInstallment;
import com.sms.finance.ReceivableInstallmentRepository;
import com.sms.finance.ReceivableRepository;
import com.sms.finance.ReceivableStatus;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.store.Store;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockLocationType;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.reporting.dto.CollectionAgingSummaryResponse;
import com.sms.reporting.dto.ExecutiveOverviewResponse;
import com.sms.reporting.dto.InventoryDistributionResponse;
import com.sms.reporting.dto.OperationalExceptionItem;
import com.sms.reporting.dto.SalesPerformanceItem;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReportingServiceTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;
    @Mock
    private CustomerPaymentRepository customerPaymentRepository;
    @Mock
    private ReceivableRepository receivableRepository;
    @Mock
    private ReceivableInstallmentRepository receivableInstallmentRepository;
    @Mock
    private PaymentCustodyRepository paymentCustodyRepository;
    @Mock
    private StockUnitRepository stockUnitRepository;
    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private ReportingService reportingService;

    private UUID storeId;
    private Store store;
    private Employee employee;
    private Customer customer;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        store = new Store();
        ReflectionTestUtils.setField(store, "id", storeId);
        store.setName("Pusat Jaya Store");

        employee = new Employee();
        ReflectionTestUtils.setField(employee, "id", UUID.randomUUID());
        employee.setFullName("Budi Sales");
        employee.setEmployeeNumber("EMP-100");

        customer = new Customer();
        ReflectionTestUtils.setField(customer, "id", UUID.randomUUID());
        customer.setFullName("Joko Widodo");
        customer.setPrimaryPhone("08123456789");
    }

    @Test
    void getExecutiveOverview_aggregatesMetricsAccurately() {
        UUID orderId = UUID.randomUUID();
        SalesOrder so = new SalesOrder();
        ReflectionTestUtils.setField(so, "id", orderId);
        so.setStore(store);
        so.setStatus(SalesOrderStatus.CONFIRMED);

        SalesOrderItem item = new SalesOrderItem();
        item.setFinalPrice(new BigDecimal("2500000"));
        item.setQuantity(2);

        when(salesOrderRepository.search(storeId, null, null)).thenReturn(List.of(so));
        when(salesOrderItemRepository.findBySalesOrderId(orderId)).thenReturn(List.of(item));

        CustomerPayment payment = new CustomerPayment();
        payment.setAmount(new BigDecimal("1500000"));
        when(customerPaymentRepository.search(storeId, null)).thenReturn(List.of(payment));

        Receivable r = new Receivable();
        r.setRemainingBalance(new BigDecimal("3500000"));
        r.setStatus(ReceivableStatus.ACTIVE);
        when(receivableRepository.search(storeId, null, null)).thenReturn(List.of(r));

        when(receivableInstallmentRepository.findOverdueInstallments(any(LocalDate.class))).thenReturn(List.of());

        StockUnit unit1 = new StockUnit();
        unit1.setLocationType(StockLocationType.WAREHOUSE);
        StockUnit unit2 = new StockUnit();
        unit2.setLocationType(StockLocationType.SHOWROOM);
        when(stockUnitRepository.search(storeId, null, null)).thenReturn(List.of(unit1, unit2));

        Expense exp = new Expense();
        exp.setAmount(new BigDecimal("300000"));
        exp.setOverrun(true);
        when(expenseRepository.findByStoreId(storeId)).thenReturn(List.of(exp));

        ExecutiveOverviewResponse res = reportingService.getExecutiveOverview(storeId);

        assertThat(res.getTotalOrdersCount()).isEqualTo(1);
        assertThat(res.getTotalSalesAmount()).isEqualByComparingTo(new BigDecimal("5000000"));
        assertThat(res.getTotalCashCollected()).isEqualByComparingTo(new BigDecimal("1500000"));
        assertThat(res.getTotalOutstandingReceivables()).isEqualByComparingTo(new BigDecimal("3500000"));
        assertThat(res.getTotalStockUnitsCount()).isEqualTo(2);
        assertThat(res.getWarehouseUnitsCount()).isEqualTo(1);
        assertThat(res.getShowroomUnitsCount()).isEqualTo(1);
        assertThat(res.getTotalExpensesAmount()).isEqualByComparingTo(new BigDecimal("300000"));
        assertThat(res.getTotalOverrunExpensesCount()).isEqualTo(1);
    }

    @Test
    void getSalesPerformance_ranksSalespeopleByVolume() {
        UUID orderId = UUID.randomUUID();
        SalesOrder so = new SalesOrder();
        ReflectionTestUtils.setField(so, "id", orderId);
        so.setStore(store);
        so.setSalesperson(employee);
        so.setStatus(SalesOrderStatus.CONFIRMED);

        SalesOrderItem item = new SalesOrderItem();
        item.setFinalPrice(new BigDecimal("3000000"));
        item.setQuantity(1);

        when(salesOrderRepository.search(storeId, null, null)).thenReturn(List.of(so));
        when(salesOrderItemRepository.findBySalesOrderId(orderId)).thenReturn(List.of(item));

        List<SalesPerformanceItem> leaderboard = reportingService.getSalesPerformance(storeId, null, null);

        assertThat(leaderboard).hasSize(1);
        SalesPerformanceItem leader = leaderboard.getFirst();
        assertThat(leader.getSalespersonName()).isEqualTo("Budi Sales");
        assertThat(leader.getTotalSalesVolume()).isEqualByComparingTo(new BigDecimal("3000000"));
        assertThat(leader.getConfirmedOrdersCount()).isEqualTo(1);
        assertThat(leader.getEstimatedCommission()).isEqualByComparingTo(new BigDecimal("90000.00"));
    }

    @Test
    void getCollectionAging_categorizesBucketsCorrectly() {
        UUID recId = UUID.randomUUID();
        Receivable r = new Receivable();
        ReflectionTestUtils.setField(r, "id", recId);
        r.setRemainingBalance(new BigDecimal("2000000"));
        r.setStatus(ReceivableStatus.ACTIVE);

        LocalDate today = LocalDate.now();

        ReceivableInstallment currentInst = new ReceivableInstallment();
        currentInst.setDueDate(today.plusDays(10));
        currentInst.setAmountDue(new BigDecimal("500000"));
        currentInst.setAmountPaid(BigDecimal.ZERO);
        currentInst.setStatus(InstallmentStatus.UNPAID);

        ReceivableInstallment pastDueInst = new ReceivableInstallment();
        pastDueInst.setDueDate(today.minusDays(15));
        pastDueInst.setAmountDue(new BigDecimal("500000"));
        pastDueInst.setAmountPaid(BigDecimal.ZERO);
        pastDueInst.setStatus(InstallmentStatus.UNPAID);

        ReceivableInstallment delinquentInst = new ReceivableInstallment();
        delinquentInst.setDueDate(today.minusDays(45));
        delinquentInst.setAmountDue(new BigDecimal("500000"));
        delinquentInst.setAmountPaid(BigDecimal.ZERO);
        delinquentInst.setStatus(InstallmentStatus.UNPAID);

        ReceivableInstallment defaultedInst = new ReceivableInstallment();
        defaultedInst.setDueDate(today.minusDays(75));
        defaultedInst.setAmountDue(new BigDecimal("500000"));
        defaultedInst.setAmountPaid(BigDecimal.ZERO);
        defaultedInst.setStatus(InstallmentStatus.UNPAID);

        when(receivableRepository.search(storeId, null, null)).thenReturn(List.of(r));
        when(receivableInstallmentRepository.findByReceivableIdOrderByInstallmentNumberAsc(recId))
                .thenReturn(List.of(currentInst, pastDueInst, delinquentInst, defaultedInst));
        when(customerPaymentRepository.search(storeId, null)).thenReturn(List.of());
        when(paymentCustodyRepository.search(isNull(), eq(CustodyStatus.DISCREPANCY))).thenReturn(List.of());

        CollectionAgingSummaryResponse res = reportingService.getCollectionAging(storeId);

        assertThat(res.getBuckets()).hasSize(4);
        assertThat(res.getTotalOverdueBalance()).isEqualByComparingTo(new BigDecimal("1500000"));
        assertThat(res.getBuckets().get(0).getInstallmentCount()).isEqualTo(1); // Current
        assertThat(res.getBuckets().get(1).getInstallmentCount()).isEqualTo(1); // Past Due
        assertThat(res.getBuckets().get(2).getInstallmentCount()).isEqualTo(1); // Delinquent
        assertThat(res.getBuckets().get(3).getInstallmentCount()).isEqualTo(1); // Default Risk
    }

    @Test
    void getInventoryDistribution_computesLocationAndAvailability() {
        StockUnit u1 = new StockUnit();
        u1.setLocationType(StockLocationType.WAREHOUSE);
        u1.setAvailabilityStatus(StockAvailability.AVAILABLE);

        StockUnit u2 = new StockUnit();
        u2.setLocationType(StockLocationType.SHOWROOM);
        u2.setAvailabilityStatus(StockAvailability.RESERVED);

        StockUnit u3 = new StockUnit();
        u3.setLocationType(StockLocationType.REPAIR_AREA);
        u3.setAvailabilityStatus(StockAvailability.UNAVAILABLE);

        when(stockUnitRepository.search(storeId, null, null)).thenReturn(List.of(u1, u2, u3));

        InventoryDistributionResponse res = reportingService.getInventoryDistribution(storeId);

        assertThat(res.getTotalUnits()).isEqualTo(3);
        assertThat(res.getWarehouseUnits()).isEqualTo(1);
        assertThat(res.getShowroomUnits()).isEqualTo(1);
        assertThat(res.getRepairAreaUnits()).isEqualTo(1);
        assertThat(res.getAvailableUnits()).isEqualTo(1);
        assertThat(res.getReservedUnits()).isEqualTo(1);
        assertThat(res.getUnavailableUnits()).isEqualTo(1);
    }

    @Test
    void getOperationalExceptions_identifiesOverrunsAndDiscrepancies() {
        ExpenseCategory cat = new ExpenseCategory();
        cat.setName("Fuel & Transport");

        Expense exp = new Expense();
        exp.setExpenseNumber("EXP-001");
        exp.setAmount(new BigDecimal("450000"));
        exp.setExpenseCategory(cat);
        exp.setOverrun(true);

        when(expenseRepository.findByStoreId(storeId)).thenReturn(List.of(exp));

        CustomerPayment pay = new CustomerPayment();
        pay.setPaymentNumber("PAY-001");
        pay.setStore(store);

        PaymentCustody custody = new PaymentCustody();
        custody.setCustomerPayment(pay);
        custody.setStatus(CustodyStatus.DISCREPANCY);
        custody.setDiscrepancyAmount(new BigDecimal("50000"));

        when(paymentCustodyRepository.search(isNull(), eq(CustodyStatus.DISCREPANCY))).thenReturn(List.of(custody));
        when(receivableInstallmentRepository.findOverdueInstallments(any(LocalDate.class))).thenReturn(List.of());

        List<OperationalExceptionItem> exceptions = reportingService.getOperationalExceptions(storeId);

        assertThat(exceptions).hasSize(2);
        assertThat(exceptions.stream().anyMatch(e -> e.getExceptionType().equals("BUDGET_OVERRUN"))).isTrue();
        assertThat(exceptions.stream().anyMatch(e -> e.getExceptionType().equals("CUSTODY_DISCREPANCY"))).isTrue();
    }

    @Test
    void generateCsvExports_producesCorrectHeadersAndRows() {
        Receivable r = new Receivable();
        r.setReceivableNumber("REC-001");
        r.setCustomer(customer);
        r.setStore(store);
        r.setTotalAmount(new BigDecimal("5000000"));
        r.setRemainingBalance(new BigDecimal("2500000"));
        r.setPaymentTermMonths(6);
        r.setStatus(ReceivableStatus.ACTIVE);
        r.setFirstDueDate(LocalDate.of(2026, 11, 1));

        when(receivableRepository.search(storeId, null, null)).thenReturn(List.of(r));

        String csv = reportingService.generateReceivablesReportCsv(storeId);

        assertThat(csv).contains("Receivable Number,Customer Name,Phone,Store,Total Amount,Remaining Balance,Term Months,Status,First Due Date");
        assertThat(csv).contains("REC-001");
        assertThat(csv).contains("Joko Widodo");
        assertThat(csv).contains("5000000");
    }
}
