package com.sms.repossession.dto;

import com.sms.repossession.WarrantyCoverageDecision;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class DecideWarrantyClaimRequest {

    @NotNull
    private WarrantyCoverageDecision coverageDecision;

    private UUID replacementStockUnitId;

    private String decisionNotes;
}
