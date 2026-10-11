package com.sms.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import com.sms.customer.Customer;
import com.sms.customer.CustomerAddress;
import com.sms.foundation.approval.ApprovalRequest;
import com.sms.foundation.approval.ApprovalRequestRepository;
import com.sms.foundation.approval.ApprovalStatus;
import com.sms.foundation.store.Store;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.sms.product.repository.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SalesOrderServiceTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private SalesOrderItemRepository itemRepository;
    @Mock
    private com.sms.foundation.store.StoreRepository storeRepository;
    @Mock
    private com.sms.customer.CustomerRepository customerRepository;
    @Mock
    private com.sms.customer.CustomerAddressRepository addressRepository;
    @Mock
    private com.sms.foundation.employee.EmployeeRepository employeeRepository;
    @Mock
    private ProductVariantRepository variantRepository;
    @Mock
    private com.sms.pricing.StoreProductPriceRepository priceRepository;
    @Mock
    private com.sms.pricing.StoreProductPaymentPlanRepository planRepository;
    @Mock
    private com.sms.foundation.approval.ApprovalService approvalService;
    @Mock
    private ApprovalRequestRepository approvalRequestRepository;
    @Mock
    private com.sms.foundation.numbering.DocumentNumberingService numberingService;
    @Mock
    private com.sms.survey.SurveyRepository surveyRepository;
    @Mock
    private com.sms.inventory.ReservationService reservationService;

    @InjectMocks
    private SalesOrderService salesOrderService;

    private SalesOrder salesOrder;
    private UUID soId;

    @BeforeEach
    void setUp() {
        soId = UUID.randomUUID();
        Store store = new Store();
        store.setCode("STR01");
        salesOrder = new SalesOrder();
        salesOrder.setStore(store);
        salesOrder.setCustomer(new Customer());
        salesOrder.setDeliveryAddress(new CustomerAddress());
        salesOrder.setStatus(SalesOrderStatus.PENDING_PRICE_APPROVAL);
        salesOrder.setRequiresPriceApproval(true);
        salesOrder.setApprovalRequestId(UUID.randomUUID());
    }

    @Test
    void release_throwsAndMarksRejectedWhenApprovalWasRejected() {
        when(salesOrderRepository.findById(soId)).thenReturn(Optional.of(salesOrder));
        SalesOrderItem item = new SalesOrderItem();
        item.setFinalPrice(BigDecimal.TEN);
        item.setReferencePrice(BigDecimal.ONE);
        when(itemRepository.findBySalesOrderId(soId)).thenReturn(List.of(item));

        ApprovalRequest rejected = new ApprovalRequest();
        rejected.setStatus(ApprovalStatus.REJECTED);
        when(approvalRequestRepository.findById(salesOrder.getApprovalRequestId())).thenReturn(Optional.of(rejected));

        assertThatThrownBy(() -> salesOrderService.release(soId)).isInstanceOf(BusinessRuleException.class);
        assertThat(salesOrder.getStatus()).isEqualTo(SalesOrderStatus.REJECTED);
    }

    @Test
    void release_throwsWhenApprovalStillPending() {
        when(salesOrderRepository.findById(soId)).thenReturn(Optional.of(salesOrder));
        SalesOrderItem item = new SalesOrderItem();
        item.setFinalPrice(BigDecimal.TEN);
        item.setReferencePrice(BigDecimal.ONE);
        when(itemRepository.findBySalesOrderId(soId)).thenReturn(List.of(item));

        ApprovalRequest pending = new ApprovalRequest();
        pending.setStatus(ApprovalStatus.PENDING);
        when(approvalRequestRepository.findById(salesOrder.getApprovalRequestId())).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> salesOrderService.release(soId)).isInstanceOf(BusinessRuleException.class);
        assertThat(salesOrder.getStatus()).isEqualTo(SalesOrderStatus.PENDING_PRICE_APPROVAL);
    }

    @Test
    void release_succeedsAndAssignsNumberWhenApprovalApproved() {
        when(salesOrderRepository.findById(soId)).thenReturn(Optional.of(salesOrder));
        SalesOrderItem item = new SalesOrderItem();
        item.setFinalPrice(BigDecimal.TEN);
        item.setReferencePrice(BigDecimal.ONE);
        when(itemRepository.findBySalesOrderId(soId)).thenReturn(List.of(item));

        ApprovalRequest approved = new ApprovalRequest();
        approved.setStatus(ApprovalStatus.APPROVED);
        when(approvalRequestRepository.findById(salesOrder.getApprovalRequestId())).thenReturn(Optional.of(approved));
        when(numberingService.nextNumber(any(), any())).thenReturn("SO/STR01/08/2026/0001");

        SalesOrder result = salesOrderService.release(soId);

        assertThat(result.getStatus()).isEqualTo(SalesOrderStatus.RELEASED);
        assertThat(result.getNumber()).isEqualTo("SO/STR01/08/2026/0001");
    }
}
