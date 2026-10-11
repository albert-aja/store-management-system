package com.sms.repossession.dto;

import com.sms.repossession.StockReturnType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateStockReturnRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID customerId;

    private UUID salesOrderId;

    @NotNull
    private UUID stockUnitId;

    private UUID receivableId;

    private StockReturnType returnType = StockReturnType.REPOSSESSION;

    private UUID driverId;

    private UUID helperId;

    private String vehiclePlate;

    private LocalDate scheduledDate;

    private String reason;

    private String notes;
}
