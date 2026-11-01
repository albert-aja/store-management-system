package com.sms.foundation.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.sms.common.web.NotFoundException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.finance.CustomerPayment;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.InstallmentStatus;
import com.sms.finance.PaymentMethod;
import com.sms.finance.PaymentType;
import com.sms.finance.Receivable;
import com.sms.finance.ReceivableInstallment;
import com.sms.finance.ReceivableRepository;
import com.sms.finance.ReceivableStatus;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.store.Store;
import com.sms.payroll.PayrollSlipRepository;
import com.sms.repossession.StockReturnRepository;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
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
class PrintableDocumentServiceTest {

    @Mock
    private DeliveryOrderRepository deliveryOrderRepository;
    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;
    @Mock
    private CustomerPaymentRepository customerPaymentRepository;
    @Mock
    private PayrollSlipRepository payrollSlipRepository;
    @Mock
    private StockReturnRepository stockReturnRepository;
    @Mock
    private ReceivableRepository receivableRepository;
    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private PrintableDocumentService printableDocumentService;

    private Customer testCustomer;
    private Store testStore;
    private Receivable testReceivable;
    private SalesOrder testSalesOrder;

    @BeforeEach
    void setUp() {
        testCustomer = new Customer();
        ReflectionTestUtils.setField(testCustomer, "id", UUID.randomUUID());
        testCustomer.setFullName("Budi Santoso");
        testCustomer.setNik("3515081234567890");
        testCustomer.setPrimaryPhone("081234567890");
        testCustomer.setSegment("STAR_CREDIT");
        testCustomer.setCreditScoreGrade("A");
        testCustomer.setCreditScorePoints(92);

        testStore = new Store();
        ReflectionTestUtils.setField(testStore, "id", UUID.randomUUID());
        testStore.setName("SMS Cabang Waru");
        testStore.setAddress("Jl. Raya Waru No. 12, Sidoarjo");

        testSalesOrder = new SalesOrder();
        ReflectionTestUtils.setField(testSalesOrder, "id", UUID.randomUUID());
        testSalesOrder.setNumber("SO-20261101-001");
        testSalesOrder.setCustomer(testCustomer);
        testSalesOrder.setStore(testStore);

        testReceivable = new Receivable();
        ReflectionTestUtils.setField(testReceivable, "id", UUID.randomUUID());
        testReceivable.setReceivableNumber("REC-20261101-001");
        testReceivable.setCustomer(testCustomer);
        testReceivable.setStore(testStore);
        testReceivable.setSalesOrder(testSalesOrder);
        testReceivable.setTotalAmount(new BigDecimal("6000000"));
        testReceivable.setDownPaymentAmount(new BigDecimal("1000000"));
        testReceivable.setFinancedAmount(new BigDecimal("5000000"));
        testReceivable.setTotalPaid(new BigDecimal("2000000"));
        testReceivable.setRemainingBalance(new BigDecimal("4000000"));
        testReceivable.setPaymentTermMonths(10);
        testReceivable.setStatus(ReceivableStatus.ACTIVE);

        ReceivableInstallment inst1 = new ReceivableInstallment();
        inst1.setInstallmentNumber(1);
        inst1.setDueDate(LocalDate.now().minusMonths(1));
        inst1.setAmountDue(new BigDecimal("500000"));
        inst1.setAmountPaid(new BigDecimal("500000"));
        inst1.setStatus(InstallmentStatus.PAID);
        inst1.setPaidAt(Instant.now().minusSeconds(86400 * 30));

        ReceivableInstallment inst2 = new ReceivableInstallment();
        inst2.setInstallmentNumber(2);
        inst2.setDueDate(LocalDate.now().minusDays(5));
        inst2.setAmountDue(new BigDecimal("500000"));
        inst2.setAmountPaid(BigDecimal.ZERO);
        inst2.setStatus(InstallmentStatus.UNPAID);

        testReceivable.setInstallments(List.of(inst1, inst2));
    }

    @Test
    void generateCustomerBillingStatementHtml_producesDetailedLedger() {
        UUID customerId = testCustomer.getId();
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(testCustomer));
        when(receivableRepository.findByCustomerId(customerId)).thenReturn(List.of(testReceivable));

        Employee collector = new Employee();
        collector.setFullName("Agus Kolektor");

        CustomerPayment payment = new CustomerPayment();
        payment.setPaymentNumber("PAY-202611-0001");
        payment.setAmount(new BigDecimal("500000"));
        payment.setPaidAt(Instant.now().minusSeconds(86400 * 25));
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setPaymentType(PaymentType.INSTALLMENT);
        payment.setCollectedBy(collector);

        when(customerPaymentRepository.findByCustomerIdOrderByPaidAtDesc(customerId)).thenReturn(List.of(payment));

        String html = printableDocumentService.generateCustomerBillingStatementHtml(customerId);

        assertThat(html).isNotNull();
        assertThat(html).contains("LEMBAR REKENING KORAN TAGIHAN");
        assertThat(html).contains("Budi Santoso");
        assertThat(html).contains("3515081234567890");
        assertThat(html).contains("SMS Cabang Waru");
        assertThat(html).contains("STAR_CREDIT");
        assertThat(html).contains("Grade A (92 Poin)");
        assertThat(html).contains("REC-20261101-001");
        assertThat(html).contains("SO-20261101-001");
        assertThat(html).contains("PERHATIAN KHUSUS"); // Due to inst2 overdue
        assertThat(html).contains("TERTUNGGAK");
        assertThat(html).contains("LUNAS");
        assertThat(html).contains("PAY-202611-0001");
        assertThat(html).contains("Agus Kolektor");
        assertThat(html).contains("PEMBERITAHUAN MANAJEMEN ANGSURAN");
        assertThat(html).contains("Bagian Finance &amp; Admin Piutang".replace("&amp;", "&"));
    }

    @Test
    void generateReceivableStatementHtml_rendersStatementForReceivable() {
        UUID recId = testReceivable.getId();
        when(receivableRepository.findById(recId)).thenReturn(Optional.of(testReceivable));
        when(receivableRepository.findByCustomerId(testCustomer.getId())).thenReturn(List.of(testReceivable));
        when(customerPaymentRepository.findByCustomerIdOrderByPaidAtDesc(testCustomer.getId())).thenReturn(List.of());

        String html = printableDocumentService.generateReceivableStatementHtml(recId);

        assertThat(html).contains("REC-20261101-001");
        assertThat(html).contains("Budi Santoso");
    }

    @Test
    void generateBulkHtml_supportsCustomerStatementWithPageBreaks() {
        Customer cust2 = new Customer();
        UUID cust2Id = UUID.randomUUID();
        ReflectionTestUtils.setField(cust2, "id", cust2Id);
        cust2.setFullName("Siti Aminah");
        cust2.setNik("3515089999990001");

        when(customerRepository.findById(testCustomer.getId())).thenReturn(Optional.of(testCustomer));
        when(customerRepository.findById(cust2Id)).thenReturn(Optional.of(cust2));
        when(receivableRepository.findByCustomerId(testCustomer.getId())).thenReturn(List.of(testReceivable));
        when(receivableRepository.findByCustomerId(cust2Id)).thenReturn(List.of());

        String bulkHtml = printableDocumentService.generateBulkHtml(
                "CUSTOMER_STATEMENT",
                List.of(testCustomer.getId(), cust2Id)
        );

        assertThat(bulkHtml).contains("Cetak Massal CUSTOMER_STATEMENT (2 Dokumen)");
        assertThat(bulkHtml).contains("Budi Santoso");
        assertThat(bulkHtml).contains("Siti Aminah");
        assertThat(bulkHtml).contains("page-break");
    }

    @Test
    void generateCustomerStatementsBatchHtml_batchRunsCleanly() {
        when(customerRepository.findAllById(List.of(testCustomer.getId()))).thenReturn(List.of(testCustomer));
        when(receivableRepository.findByCustomerId(testCustomer.getId())).thenReturn(List.of(testReceivable));

        String batchHtml = printableDocumentService.generateCustomerStatementsBatchHtml(
                null, List.of(testCustomer.getId()), null
        );

        assertThat(batchHtml).contains("Rekening Koran & Tagihan Pelanggan (1 Dokumen)");
        assertThat(batchHtml).contains("Budi Santoso");
    }

    @Test
    void customerNotFound_throwsNotFoundException() {
        UUID missingId = UUID.randomUUID();
        when(customerRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> printableDocumentService.generateCustomerBillingStatementHtml(missingId))
                .isInstanceOf(NotFoundException.class);
    }
}

