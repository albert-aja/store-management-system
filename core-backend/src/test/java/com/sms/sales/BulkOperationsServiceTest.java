package com.sms.sales;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.sms.common.dto.BulkOperationResult;
import com.sms.foundation.document.PrintableDocumentService;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockMovementRepository;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.inventory.StockUnitService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BulkOperationsServiceTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;
    @Mock
    private com.sms.inventory.ReservationService reservationService;

    @InjectMocks
    private SalesOrderService salesOrderService;

    @Mock
    private StockUnitRepository stockUnitRepository;
    @Mock
    private StockMovementRepository movementRepository;
    @Mock
    private com.sms.foundation.store.StoreRepository storeRepository;
    @Mock
    private com.sms.product.repository.ProductVariantRepository variantRepository;

    @InjectMocks
    private StockUnitService stockUnitService;

    @Mock
    private com.sms.delivery.DeliveryOrderRepository deliveryOrderRepository;
    @Mock
    private SalesOrderItemRepository salesOrderItemRepository;
    @Mock
    private com.sms.finance.CustomerPaymentRepository customerPaymentRepository;
    @Mock
    private com.sms.payroll.PayrollSlipRepository payrollSlipRepository;
    @Mock
    private com.sms.repossession.StockReturnRepository stockReturnRepository;

    @InjectMocks
    private PrintableDocumentService printableDocumentService;

    private UUID soId1;
    private UUID soId2;
    private SalesOrder so1;
    private SalesOrder so2;

    @BeforeEach
    void setUp() {
        soId1 = UUID.randomUUID();
        soId2 = UUID.randomUUID();

        so1 = new SalesOrder();
        org.springframework.test.util.ReflectionTestUtils.setField(so1, "id", soId1);
        so1.setStatus(SalesOrderStatus.DRAFT);

        so2 = new SalesOrder();
        org.springframework.test.util.ReflectionTestUtils.setField(so2, "id", soId2);
        so2.setStatus(SalesOrderStatus.CONFIRMED); // cannot cancel confirmed without refund logic
    }

    @Test
    void bulkUpdateStatus_salesOrders_cancelsEligibleOrdersAndReportsFailures() {
        when(salesOrderRepository.findById(soId1)).thenReturn(Optional.of(so1));
        when(salesOrderRepository.findById(soId2)).thenReturn(Optional.of(so2));

        BulkOperationResult result = salesOrderService.bulkUpdateStatus(
                List.of(soId1, soId2), "CANCEL", "Customer cancelled"
        );

        assertThat(result.totalRequested()).isEqualTo(2);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.failureCount()).isEqualTo(1);
        assertThat(so1.getStatus()).isEqualTo(SalesOrderStatus.CANCELLED);
        assertThat(so1.getCancelReason()).isEqualTo("Customer cancelled");
    }

    @Test
    void bulkAdjustAvailability_stockUnits_updatesAvailabilityBatch() {
        UUID unitId = UUID.randomUUID();
        StockUnit unit = new StockUnit();
        unit.setAvailabilityStatus(StockAvailability.AVAILABLE);

        when(stockUnitRepository.findById(unitId)).thenReturn(Optional.of(unit));

        BulkOperationResult result = stockUnitService.bulkAdjustAvailability(
                List.of(unitId), StockAvailability.UNAVAILABLE, "Damaged in warehouse"
        );

        assertThat(result.totalRequested()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.failureCount()).isEqualTo(0);
        assertThat(unit.getAvailabilityStatus()).isEqualTo(StockAvailability.UNAVAILABLE);
    }

    @Test
    void generateBulkHtml_producesPageBreaksAndMultiDocumentHeader() {
        when(salesOrderRepository.findById(soId1)).thenReturn(Optional.of(so1));
        when(salesOrderItemRepository.findBySalesOrderId(soId1)).thenReturn(List.of());

        String html = printableDocumentService.generateBulkHtml("SALES_ORDER_INVOICE", List.of(soId1));

        assertThat(html).contains("Cetak Massal");
        assertThat(html).contains("FAKTUR PENJUALAN");
        assertThat(html).contains("1 Dokumen");
    }
}
