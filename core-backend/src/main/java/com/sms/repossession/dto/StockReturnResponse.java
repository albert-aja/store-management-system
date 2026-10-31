package com.sms.repossession.dto;

import com.sms.repossession.StockReturn;
import com.sms.repossession.StockReturnStatus;
import com.sms.repossession.StockReturnType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockReturnResponse {
    private UUID id;
    private String returnNumber;
    private UUID storeId;
    private String storeName;
    private UUID customerId;
    private String customerName;
    private UUID salesOrderId;
    private String salesOrderNumber;
    private UUID stockUnitId;
    private String manufacturerSerial;
    private String productVariantName;
    private UUID receivableId;
    private String receivableNumber;
    private StockReturnType returnType;
    private StockReturnStatus status;
    private UUID driverId;
    private String driverName;
    private UUID helperId;
    private String helperName;
    private String vehiclePlate;
    private LocalDate scheduledDate;
    private Instant recoveredAt;
    private String customerRefusalReason;
    private String reason;
    private String notes;
    private Instant createdAt;
    private StockReturnDispositionResponse disposition;

    public static StockReturnResponse from(StockReturn r) {
        return StockReturnResponse.builder()
                .id(r.getId())
                .returnNumber(r.getReturnNumber())
                .storeId(r.getStore().getId())
                .storeName(r.getStore().getName())
                .customerId(r.getCustomer() != null ? r.getCustomer().getId() : null)
                .customerName(r.getCustomer() != null ? r.getCustomer().getFullName() : null)
                .salesOrderId(r.getSalesOrder() != null ? r.getSalesOrder().getId() : null)
                .salesOrderNumber(r.getSalesOrder() != null ? r.getSalesOrder().getNumber() : null)
                .stockUnitId(r.getStockUnit() != null ? r.getStockUnit().getId() : null)
                .manufacturerSerial(r.getStockUnit() != null ? r.getStockUnit().getManufacturerSerial() : null)
                .productVariantName(r.getStockUnit() != null && r.getStockUnit().getProductVariant() != null ? r.getStockUnit().getProductVariant().getVariantName() : null)
                .receivableId(r.getReceivable() != null ? r.getReceivable().getId() : null)
                .receivableNumber(r.getReceivable() != null ? r.getReceivable().getReceivableNumber() : null)
                .returnType(r.getReturnType())
                .status(r.getStatus())
                .driverId(r.getDriver() != null ? r.getDriver().getId() : null)
                .driverName(r.getDriver() != null ? r.getDriver().getFullName() : null)
                .helperId(r.getHelper() != null ? r.getHelper().getId() : null)
                .helperName(r.getHelper() != null ? r.getHelper().getFullName() : null)
                .vehiclePlate(r.getVehiclePlate())
                .scheduledDate(r.getScheduledDate())
                .recoveredAt(r.getRecoveredAt())
                .customerRefusalReason(r.getCustomerRefusalReason())
                .reason(r.getReason())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .disposition(StockReturnDispositionResponse.from(r.getDisposition()))
                .build();
    }
}
