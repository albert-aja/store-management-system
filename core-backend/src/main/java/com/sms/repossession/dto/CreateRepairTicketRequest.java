package com.sms.repossession.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateRepairTicketRequest {

    @NotNull
    private UUID storeId;

    @NotNull
    private UUID stockUnitId;

    private UUID warrantyClaimId;

    private UUID stockReturnId;

    private String vendorName;

    @NotBlank
    private String problemDescription;
}
