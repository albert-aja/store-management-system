package com.sms.repossession.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateStockDisposalRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID stockUnitId;

    @NotBlank
    private String reason;

    private String buyerName;

    private BigDecimal scrapProceeds;

    @NotNull
    private UUID authorizedById;

    private String notes;
}
