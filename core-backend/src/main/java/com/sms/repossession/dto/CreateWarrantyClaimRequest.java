package com.sms.repossession.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateWarrantyClaimRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID customerId;

    private UUID salesOrderId;

    @NotNull
    private UUID stockUnitId;

    private String distributorName;

    @NotBlank
    private String defectDescription;

    private String distributorClaimRef;
}
