package com.sms.storefront;

import com.sms.customer.Customer;
import com.sms.foundation.store.Store;
import com.sms.product.dto.Product;
import com.sms.product.dto.ProductVariant;
import com.sms.sales.SalesOrder;
import com.sms.sales.SalesOrderItem;
import com.sms.sales.SalesOrderRepository;
import com.sms.sales.SalesOrderStatus;
import com.sms.storefront.dto.HandoverVerificationResultDto;
import com.sms.storefront.dto.StagePickupRequest;
import com.sms.storefront.dto.StorefrontPickupPassDto;
import com.sms.storefront.dto.VerifyHandoverRequest;
import com.sms.storefront.model.FulfillmentGroup;
import com.sms.storefront.model.FulfillmentGroupItem;
import com.sms.storefront.repository.FulfillmentGroupItemRepository;
import com.sms.storefront.repository.FulfillmentGroupRepository;
import com.sms.storefront.service.StorefrontPickupService;
import com.sms.storefront.service.StorefrontPushNotificationService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StorefrontPickupServiceTest {

    @Mock
    private FulfillmentGroupRepository fulfillmentGroupRepository;

    @Mock
    private FulfillmentGroupItemRepository fulfillmentGroupItemRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private StorefrontPushNotificationService pushNotificationService;

    @InjectMocks
    private StorefrontPickupService pickupService;

    private SalesOrder order;
    private Store store;
    private Customer customer;
    private FulfillmentGroup pickupGroup;
    private FulfillmentGroupItem item;

    @BeforeEach
    void setUp() {
        store = new Store();
        store.setCode("STORE-01");
        store.setName("SMS Mart Showroom Central");
        store.setAddress("Jl. Sudirman No. 42");

        customer = new Customer();
        customer.setFullName("Budi Santoso");
        customer.setPrimaryPhone("08123456789");

        order = new SalesOrder();
        order.setNumber("SO-WEB-999888");
        order.setStore(store);
        order.setCustomer(customer);
        order.setStatus(SalesOrderStatus.CONFIRMED);
        order.setTotalAmount(BigDecimal.valueOf(1500000));
        order.setRequiredDepositAmount(BigDecimal.valueOf(450000));
        order.setDepositPaid(true);

        pickupGroup = new FulfillmentGroup();
        pickupGroup.setSalesOrder(order);
        pickupGroup.setGroupNumber(1);
        pickupGroup.setFulfillmentMethod("PICKUP");
        pickupGroup.setPickupStore(store);
        pickupGroup.setStatus("AWAITING_STAGING");
        pickupGroup.setPickupPassCode("PKP-1234-9888");
        pickupGroup.setPickupQrPayload("SMS-PICKUP:SO-WEB-999888:1:PKP-1234-9888");

        ProductVariant variant = new ProductVariant();
        Product product = new Product();
        product.setName("Smart TV 55 Inch");
        variant.setProduct(product);
        variant.setVariantName("Black 4K");
        variant.setSku("TV-55-BLK");

        SalesOrderItem soItem = new SalesOrderItem();
        soItem.setProductVariant(variant);

        item = new FulfillmentGroupItem();
        item.setFulfillmentGroup(pickupGroup);
        item.setSalesOrderItem(soItem);
        item.setQuantity(1);
        item.setProcurementRequired(false);
    }

    @Test
    void testGetPickupPass() {
        when(salesOrderRepository.findByNumber("SO-WEB-999888")).thenReturn(Optional.of(order));
        when(fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId()))
                .thenReturn(List.of(pickupGroup));
        when(fulfillmentGroupItemRepository.findByFulfillmentGroupId(pickupGroup.getId()))
                .thenReturn(List.of(item));

        StorefrontPickupPassDto pass = pickupService.getPickupPass("SO-WEB-999888");

        assertNotNull(pass);
        assertEquals("SO-WEB-999888", pass.getOrderNumber());
        assertEquals("PKP-1234-9888", pass.getPickupPassCode());
        assertEquals("SMS Mart Showroom Central", pass.getPickupStoreName());
        assertEquals(BigDecimal.valueOf(1050000), pass.getRemainingBalance());
        assertFalse(pass.isFullyPaid());
        assertEquals(1, pass.getItems().size());
        assertEquals("Smart TV 55 Inch", pass.getItems().get(0).getProductName());
    }

    @Test
    void testStagePickupGroup() {
        when(fulfillmentGroupRepository.findBySalesOrderNumberAndGroupNumber("SO-WEB-999888", 1))
                .thenReturn(Optional.of(pickupGroup));
        when(fulfillmentGroupRepository.save(any(FulfillmentGroup.class))).thenAnswer(i -> i.getArgument(0));
        when(fulfillmentGroupItemRepository.findByFulfillmentGroupId(pickupGroup.getId()))
                .thenReturn(List.of(item));

        StagePickupRequest request = StagePickupRequest.builder()
                .orderNumber("SO-WEB-999888")
                .groupNumber(1)
                .stagingRackLocation("Rak Display A-03")
                .stagedByStaffName("Ahmad Kasir")
                .notes("Barang sudah diuji menyala")
                .build();

        StorefrontPickupPassDto result = pickupService.stagePickupGroup(request);

        assertNotNull(result);
        assertEquals("READY_FOR_PICKUP", result.getStagingStatus());
        assertEquals("Rak Display A-03", result.getStagingRackLocation());
        assertTrue(result.isReadyForCollection());

        verify(pushNotificationService).sendMilestoneNotification(
                eq("SO-WEB-999888"),
                eq("STORE_PICKUP_READY"),
                any(),
                contains("Rak Display A-03"),
                any()
        );
    }

    @Test
    void testVerifyHandoverSuccess() {
        pickupGroup.setStatus("READY_FOR_PICKUP");

        when(fulfillmentGroupRepository.findByPickupPassCode("PKP-1234-9888"))
                .thenReturn(Optional.of(pickupGroup));
        when(fulfillmentGroupRepository.save(any(FulfillmentGroup.class))).thenAnswer(i -> i.getArgument(0));
        when(fulfillmentGroupRepository.findBySalesOrderIdOrderByGroupNumberAsc(order.getId()))
                .thenReturn(List.of(pickupGroup));

        VerifyHandoverRequest request = VerifyHandoverRequest.builder()
                .pickupPassCode("PKP-1234-9888")
                .staffEmployeeName("Ahmad Kasir")
                .recipientIdentityName("Budi Santoso")
                .recipientPhone("08123456789")
                .handoverNotes("KTP terverifikasi cocok")
                .settleRemainingBalance(true)
                .build();

        HandoverVerificationResultDto res = pickupService.verifyHandover(request);

        assertTrue(res.isSuccess());
        assertEquals("COMPLETED", pickupGroup.getStatus());
        assertEquals("Ahmad Kasir", res.getStaffEmployeeName());
        assertEquals(SalesOrderStatus.COMPLETED, order.getStatus());
        assertEquals(BigDecimal.valueOf(1050000), res.getSettledAmount());
    }

    @Test
    void testVerifyHandoverRejectsPrematurePickup() {
        pickupGroup.setStatus("AWAITING_PROCUREMENT");

        when(fulfillmentGroupRepository.findByPickupPassCode("PKP-1234-9888"))
                .thenReturn(Optional.of(pickupGroup));

        VerifyHandoverRequest request = VerifyHandoverRequest.builder()
                .pickupPassCode("PKP-1234-9888")
                .staffEmployeeName("Ahmad Kasir")
                .build();

        assertThrows(IllegalStateException.class, () -> pickupService.verifyHandover(request));
    }

    @Test
    void testVerifyHandoverRejectsDuplicateHandover() {
        pickupGroup.setStatus("COMPLETED");
        pickupGroup.setHandedOverAt(Instant.now());
        pickupGroup.setHandedOverByStaffName("Siti Supervisor");

        when(fulfillmentGroupRepository.findByPickupPassCode("PKP-1234-9888"))
                .thenReturn(Optional.of(pickupGroup));

        VerifyHandoverRequest request = VerifyHandoverRequest.builder()
                .pickupPassCode("PKP-1234-9888")
                .staffEmployeeName("Ahmad Kasir")
                .build();

        assertThrows(IllegalStateException.class, () -> pickupService.verifyHandover(request));
    }
}
