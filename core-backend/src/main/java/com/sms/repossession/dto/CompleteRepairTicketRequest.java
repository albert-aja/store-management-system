package com.sms.repossession.dto;

import com.sms.repossession.RepairStatus;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class CompleteRepairTicketRequest {

    @NotNull
    private RepairStatus status;

    private String diagnosis;

    private String actionTaken;

    private BigDecimal repairCost;

    private String notes;
}
