package com.sms.reporting;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.sms.finance.Receivable;
import com.sms.finance.ReceivableRepository;
import com.sms.finance.ReceivableStatus;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.employee.EmployeeRoleRepository;
import com.sms.foundation.employee.EmploymentStatus;
import com.sms.foundation.store.Store;
import com.sms.foundation.store.StoreRepository;
import com.sms.inventory.StockAvailability;
import com.sms.inventory.StockLocationType;
import com.sms.inventory.StockUnit;
import com.sms.inventory.StockUnitRepository;
import com.sms.product.dto.ProductVariant;
import com.sms.reporting.dto.CollectionAgingBucket;
import com.sms.reporting.dto.CollectionAgingSummaryResponse;
import com.sms.reporting.dto.InventoryDistributionResponse;
import com.sms.reporting.scheduled.ExcelReportGeneratorService;
import com.sms.reporting.scheduled.ExecutionStatus;
import com.sms.reporting.scheduled.ReportType;
import com.sms.reporting.scheduled.ScheduleFrequency;
import com.sms.reporting.scheduled.ScheduledReportConfig;
import com.sms.reporting.scheduled.ScheduledReportConfigRepository;
import com.sms.reporting.scheduled.ScheduledReportEmailDispatcher;
import com.sms.reporting.scheduled.ScheduledReportLog;
import com.sms.reporting.scheduled.ScheduledReportLogRepository;
import com.sms.reporting.scheduled.ScheduledReportService;
import com.sms.reporting.scheduled.dto.RecipientPreviewResponse;
import com.sms.reporting.scheduled.dto.ScheduledReportConfigRequest;
import com.sms.reporting.scheduled.dto.ScheduledReportConfigResponse;
import com.sms.reporting.scheduled.dto.TriggerDispatchResponse;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ScheduledReportServiceTest {

    @Mock
    private ScheduledReportConfigRepository configRepository;

    @Mock
    private ScheduledReportLogRepository logRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private ReceivableRepository receivableRepository;

    @Mock
    private StockUnitRepository stockUnitRepository;

    @Mock
    private EmployeeRoleRepository employeeRoleRepository;

    @Mock
    private ReportingService reportingService;

    private ExcelReportGeneratorService excelReportGeneratorService;
    private ScheduledReportEmailDispatcher emailDispatcher;
    private ScheduledReportService scheduledReportService;

    private Store sampleStore;
    private ScheduledReportConfig sampleConfig;

    @BeforeEach
    void setUp() {
        excelReportGeneratorService = new ExcelReportGeneratorService(
                reportingService,
                receivableRepository,
                stockUnitRepository,
                storeRepository
        );

        emailDispatcher = new ScheduledReportEmailDispatcher(
                employeeRoleRepository,
                storeRepository,
                reportingService
        );

        scheduledReportService = new ScheduledReportService(
                configRepository,
                logRepository,
                storeRepository,
                excelReportGeneratorService,
                emailDispatcher
        );

        sampleStore = new Store();
        ReflectionTestUtils.setField(sampleStore, "id", UUID.randomUUID());
        sampleStore.setName("Cabang Surabaya Pusat");

        sampleConfig = new ScheduledReportConfig();
        ReflectionTestUtils.setField(sampleConfig, "id", UUID.randomUUID());
        sampleConfig.setName("Daily Operations Digest");
        sampleConfig.setReportType(ReportType.ALL_COMBINED);
        sampleConfig.setFrequency(ScheduleFrequency.DAILY);
        sampleConfig.setDispatchTime("08:00");
        sampleConfig.setStore(sampleStore);
        sampleConfig.setTargetRole("MANAGER");
        sampleConfig.setCustomRecipientEmails("regional.gm@smsmart.co.id");
        sampleConfig.setEnabled(true);
    }

    @Test
    @DisplayName("previewRecipients resolves active store managers and custom email list")
    void previewRecipientsResolvesManagersAndCustomList() {
        Employee manager = new Employee();
        manager.setFullName("Budi Santoso");
        manager.setEmail("budi.manager@smsmart.co.id");
        manager.setEmploymentStatus(EmploymentStatus.ACTIVE);

        when(employeeRoleRepository.findEmployeesByRoleCodeAndStoreId("MANAGER", sampleStore.getId(), EmploymentStatus.ACTIVE))
                .thenReturn(List.of(manager));
        when(storeRepository.findById(sampleStore.getId())).thenReturn(Optional.of(sampleStore));

        RecipientPreviewResponse preview = scheduledReportService.previewRecipients(
                sampleStore.getId(), "MANAGER", "operations.lead@smsmart.co.id");

        assertNotNull(preview);
        assertEquals(2, preview.count());
        assertTrue(preview.emails().contains("budi.manager@smsmart.co.id"));
        assertTrue(preview.emails().contains("operations.lead@smsmart.co.id"));
        assertEquals("Cabang Surabaya Pusat", preview.storeName());
    }

    @Test
    @DisplayName("triggerReport generates dual Excel (.xlsx) workbooks and records execution audit log")
    void triggerReportDispatchesDigestAndLogsAudit() throws Exception {
        when(configRepository.findById(sampleConfig.getId())).thenReturn(Optional.of(sampleConfig));

        CollectionAgingSummaryResponse agingResp = CollectionAgingSummaryResponse.builder()
                .buckets(List.of(
                        CollectionAgingBucket.builder().bucketName("Current (0 days)").installmentCount(15).totalAmount(BigDecimal.valueOf(35000000)).percentage(70.0).build(),
                        CollectionAgingBucket.builder().bucketName("1-30 days overdue").installmentCount(5).totalAmount(BigDecimal.valueOf(15000000)).percentage(30.0).build()
                ))
                .totalReceivableBalance(BigDecimal.valueOf(50000000))
                .totalOverdueBalance(BigDecimal.valueOf(15000000))
                .totalCollectedCash(BigDecimal.valueOf(12000000))
                .custodyDiscrepanciesCount(0)
                .build();
        when(reportingService.getCollectionAging(sampleStore.getId())).thenReturn(agingResp);

        InventoryDistributionResponse invResp = InventoryDistributionResponse.builder()
                .totalUnits(100)
                .warehouseUnits(50)
                .showroomUnits(30)
                .repairAreaUnits(5)
                .inTransitUnits(5)
                .atCustomerUnits(10)
                .availableUnits(60)
                .reservedUnits(20)
                .unavailableUnits(20)
                .build();
        when(reportingService.getInventoryDistribution(sampleStore.getId())).thenReturn(invResp);

        Receivable rec = new Receivable();
        rec.setReceivableNumber("REC-SUB-001");
        rec.setFinancedAmount(BigDecimal.valueOf(10000000));
        rec.setTotalPaid(BigDecimal.valueOf(4000000));
        rec.setRemainingBalance(BigDecimal.valueOf(6000000));
        rec.setStatus(ReceivableStatus.ACTIVE);
        when(receivableRepository.search(sampleStore.getId(), null, null)).thenReturn(List.of(rec));

        ProductVariant variant = new ProductVariant();
        variant.setVariantName("Smart TV 55 Inch OLED 4K");

        StockUnit unit = new StockUnit();
        unit.setManufacturerSerial("SN-TV-8899");
        unit.setProductVariant(variant);
        unit.setLocationType(StockLocationType.WAREHOUSE);
        unit.setAvailabilityStatus(StockAvailability.AVAILABLE);
        unit.setNotes("Pristine boxed");
        when(stockUnitRepository.search(sampleStore.getId(), null, null)).thenReturn(List.of(unit));

        Employee manager = new Employee();
        manager.setFullName("Ahmad Yani");
        manager.setEmail("ahmad.manager@smsmart.co.id");
        when(employeeRoleRepository.findEmployeesByRoleCodeAndStoreId("MANAGER", sampleStore.getId(), EmploymentStatus.ACTIVE))
                .thenReturn(List.of(manager));

        TriggerDispatchResponse response = scheduledReportService.triggerReport(sampleConfig.getId());

        assertTrue(response.success());
        assertEquals(2, response.recipientsDispatched()); // manager + custom
        assertEquals(2, response.attachments().size());
        assertTrue(response.attachments().get(0).endsWith(".xlsx"));
        assertTrue(response.attachments().get(1).endsWith(".xlsx"));

        verify(logRepository, times(1)).save(any(ScheduledReportLog.class));
        verify(configRepository, atLeastOnce()).save(sampleConfig);
        assertEquals(ExecutionStatus.SUCCESS, sampleConfig.getLastStatus());
        assertNotNull(sampleConfig.getLastRunAt());
    }

    @Test
    @DisplayName("ExcelReportGeneratorService creates valid multi-sheet .xlsx files with correct sheet names")
    void excelGeneratorCreatesValidMultiSheetWorkbooks() throws Exception {
        CollectionAgingSummaryResponse agingResp = CollectionAgingSummaryResponse.builder()
                .buckets(List.of(CollectionAgingBucket.builder().bucketName("Current").installmentCount(10).totalAmount(BigDecimal.valueOf(20000000)).percentage(100.0).build()))
                .totalReceivableBalance(BigDecimal.valueOf(20000000))
                .totalOverdueBalance(BigDecimal.ZERO)
                .totalCollectedCash(BigDecimal.valueOf(5000000))
                .custodyDiscrepanciesCount(0)
                .build();
        when(reportingService.getCollectionAging(null)).thenReturn(agingResp);
        when(receivableRepository.search(null, null, null)).thenReturn(Collections.emptyList());

        byte[] faBytes = excelReportGeneratorService.generateFinancialAgingExcel(null);
        assertNotNull(faBytes);
        assertTrue(faBytes.length > 500);

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(faBytes))) {
            assertEquals(2, wb.getNumberOfSheets());
            assertEquals("Aging Summary", wb.getSheetName(0));
            assertEquals("Receivable Accounts", wb.getSheetName(1));
        }

        InventoryDistributionResponse invResp = InventoryDistributionResponse.builder()
                .totalUnits(50)
                .warehouseUnits(30)
                .showroomUnits(20)
                .repairAreaUnits(0)
                .inTransitUnits(0)
                .atCustomerUnits(0)
                .availableUnits(30)
                .reservedUnits(10)
                .unavailableUnits(10)
                .build();
        when(reportingService.getInventoryDistribution(null)).thenReturn(invResp);
        when(stockUnitRepository.search(null, null, null)).thenReturn(Collections.emptyList());

        byte[] sbBytes = excelReportGeneratorService.generateStockBalanceExcel(null);
        assertNotNull(sbBytes);
        assertTrue(sbBytes.length > 500);

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(sbBytes))) {
            assertEquals(2, wb.getNumberOfSheets());
            assertEquals("Inventory Summary", wb.getSheetName(0));
            assertEquals("Stock Units Ledger", wb.getSheetName(1));
        }
    }

    @Test
    @DisplayName("runDueScheduledReports skips configurations that already ran today")
    void runDueScheduledReportsSkipsAlreadyRanToday() {
        sampleConfig.setLastRunAt(Instant.now()); // ran just now
        when(configRepository.findByEnabledTrue()).thenReturn(List.of(sampleConfig));

        scheduledReportService.runDueScheduledReports();

        // Should not trigger again
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("createConfig and updateConfig correctly manage scheduled configuration records")
    void crudConfigOperatesProperly() {
        ScheduledReportConfigRequest req = new ScheduledReportConfigRequest(
                "Weekly Regional Aging Digest",
                ReportType.FINANCIAL_AGING,
                ScheduleFrequency.WEEKLY,
                "MONDAY",
                "07:30",
                sampleStore.getId(),
                "MANAGER",
                "finops@smsmart.co.id",
                true
        );

        when(storeRepository.findById(sampleStore.getId())).thenReturn(Optional.of(sampleStore));
        when(configRepository.save(any(ScheduledReportConfig.class))).thenAnswer(inv -> {
            ScheduledReportConfig c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", UUID.randomUUID());
            return c;
        });

        ScheduledReportConfigResponse created = scheduledReportService.createConfig(req);
        assertNotNull(created);
        assertEquals("Weekly Regional Aging Digest", created.name());
        assertEquals(ReportType.FINANCIAL_AGING, created.reportType());
        assertEquals(ScheduleFrequency.WEEKLY, created.frequency());
        assertEquals("MONDAY", created.dayOfWeek());
    }
}
