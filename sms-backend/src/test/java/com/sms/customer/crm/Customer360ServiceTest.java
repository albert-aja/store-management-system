package com.sms.customer.crm;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.sms.customer.Customer;
import com.sms.customer.CustomerRepository;
import com.sms.customer.crm.dto.*;
import com.sms.delivery.DeliveryOrderRepository;
import com.sms.finance.CustomerPaymentRepository;
import com.sms.finance.ReceivableRepository;
import com.sms.foundation.employee.EmployeeRepository;
import com.sms.repossession.StockReturnRepository;
import com.sms.sales.SalesOrderItemRepository;
import com.sms.sales.SalesOrderRepository;
import com.sms.survey.SurveyRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class Customer360ServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerTagRepository customerTagRepository;
    @Mock
    private CustomerInteractionRepository interactionRepository;
    @Mock
    private CustomerFollowUpRepository followUpRepository;
    @Mock
    private CustomerPromiseToPayRepository ptpRepository;
    @Mock
    private StoreCreditEntryRepository storeCreditRepository;
    @Mock
    private StoreVoucherRepository storeVoucherRepository;
    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private CustomerPaymentRepository paymentRepository;
    @Mock
    private ReceivableRepository receivableRepository;
    @Mock
    private DeliveryOrderRepository deliveryOrderRepository;
    @Mock
    private StockReturnRepository stockReturnRepository;
    @Mock
    private SurveyRepository surveyRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;

    @InjectMocks
    private Customer360Service customer360Service;

    private Customer customer;
    private UUID customerId;

    @BeforeEach
    void setUp() {
        customerId = UUID.randomUUID();
        customer = new Customer();
        ReflectionTestUtils.setField(customer, "id", customerId);
        customer.setFullName("Budi Santoso");
        customer.setNik("3171012345678901");
        customer.setPrimaryPhone("081234567890");
        customer.setPrimaryEmail("budi@example.com");
    }

    @Test
    void testGetCustomer360Summary() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(salesOrderRepository.search(null, customerId, null)).thenReturn(Collections.emptyList());
        when(paymentRepository.findByCustomerIdOrderByPaidAtDesc(customerId)).thenReturn(Collections.emptyList());
        when(receivableRepository.findByCustomerId(customerId)).thenReturn(Collections.emptyList());
        when(stockReturnRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Collections.emptyList());
        when(customerTagRepository.findByCustomerIdOrderByTagNameAsc(customerId)).thenReturn(Collections.emptyList());
        when(storeCreditRepository.findFirstByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Optional.empty());
        when(storeVoucherRepository.findByAssignedCustomerIdOrderByValidUntilAsc(customerId)).thenReturn(Collections.emptyList());
        when(ptpRepository.countByCustomerIdAndStatus(customerId, PtpStatus.PENDING)).thenReturn(0L);
        when(followUpRepository.findByCustomerIdOrderByScheduledAtAsc(customerId)).thenReturn(Collections.emptyList());
        when(interactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Collections.emptyList());
        when(ptpRepository.findByCustomerIdOrderByPromisedDateDesc(customerId)).thenReturn(Collections.emptyList());
        when(storeCreditRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Collections.emptyList());

        Customer360Response response = customer360Service.getCustomer360Summary(customerId);

        assertThat(response).isNotNull();
        assertThat(response.fullName()).isEqualTo("Budi Santoso");
        assertThat(response.creditScoreGrade()).isEqualTo("B");
        assertThat(response.segment()).isEqualTo("STANDARD");
        verify(customerRepository).save(customer);
    }

    @Test
    void testFuzzyDuplicateDetection() {
        Customer c2 = new Customer();
        ReflectionTestUtils.setField(c2, "id", UUID.randomUUID());
        c2.setFullName("Budi Santoso");
        c2.setNik("3171012345678901");
        c2.setPrimaryPhone("+62 812-3456-7890");

        when(customerRepository.findAll()).thenReturn(List.of(c2));

        DuplicateCheckRequest req = new DuplicateCheckRequest(
                null,
                "Budi Santoso",
                "081234567890",
                "3171012345678901",
                null
        );

        List<DuplicateMatchResult> matches = customer360Service.findFuzzyDuplicates(req);

        assertThat(matches).isNotEmpty();
        assertThat(matches.get(0).matchScorePercent()).isGreaterThanOrEqualTo(90);
        assertThat(matches.get(0).matchReasons()).contains("Exact Indonesian National ID (NIK) match");
    }

    @Test
    void testPromiseToPayRecording() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(ptpRepository.save(any(CustomerPromiseToPay.class))).thenAnswer(invocation -> {
            CustomerPromiseToPay p = invocation.getArgument(0);
            ReflectionTestUtils.setField(p, "id", UUID.randomUUID());
            return p;
        });

        PtpRequest req = new PtpRequest(null, BigDecimal.valueOf(500000), LocalDate.now().plusDays(5), "Will pay next week");
        PtpResponse resp = customer360Service.recordPtp(customerId, req, null);

        assertThat(resp).isNotNull();
        assertThat(resp.promisedAmount()).isEqualByComparingTo("500000");
        assertThat(resp.status()).isEqualTo(PtpStatus.PENDING);
    }

    @Test
    void testOmnichannelInteractionLogging() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(interactionRepository.save(any(CustomerInteraction.class))).thenAnswer(invocation -> {
            CustomerInteraction i = invocation.getArgument(0);
            ReflectionTestUtils.setField(i, "id", UUID.randomUUID());
            return i;
        });

        InteractionRequest req = new InteractionRequest(
                InteractionChannel.WHATSAPP,
                InteractionDirection.OUTBOUND,
                "Follow up promo kulkas",
                "Pelanggan tertarik menunggu gajian",
                InteractionOutcome.POSITIVE
        );

        InteractionResponse resp = customer360Service.logInteraction(customerId, req, null);

        assertThat(resp).isNotNull();
        assertThat(resp.channel()).isEqualTo(InteractionChannel.WHATSAPP);
        assertThat(resp.outcome()).isEqualTo(InteractionOutcome.POSITIVE);
    }

    @Test
    void testStoreCreditGrantAndRedeem() {
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeCreditRepository.findFirstByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Optional.empty());

        when(storeCreditRepository.save(any(StoreCreditEntry.class))).thenAnswer(invocation -> {
            StoreCreditEntry e = invocation.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        // Grant 100,000
        StoreCreditRequest grantReq = new StoreCreditRequest(BigDecimal.valueOf(100000), "Loyalty Bonus", null, null);
        StoreCreditResponse grantResp = customer360Service.grantStoreCredit(customerId, grantReq, null);

        assertThat(grantResp.amount()).isEqualByComparingTo("100000");
        assertThat(grantResp.balanceAfter()).isEqualByComparingTo("100000");

        // Mock balance for redeem
        StoreCreditEntry entryWithBal = new StoreCreditEntry();
        entryWithBal.setBalanceAfter(BigDecimal.valueOf(100000));
        when(storeCreditRepository.findFirstByCustomerIdOrderByCreatedAtDesc(customerId)).thenReturn(Optional.of(entryWithBal));

        // Redeem 40,000
        StoreCreditRequest redeemReq = new StoreCreditRequest(BigDecimal.valueOf(40000), "Applied to SO-101", "SALES_ORDER", UUID.randomUUID());
        StoreCreditResponse redeemResp = customer360Service.redeemStoreCredit(customerId, redeemReq, null);

        assertThat(redeemResp.amount()).isEqualByComparingTo("40000");
        assertThat(redeemResp.balanceAfter()).isEqualByComparingTo("60000");
    }
}
