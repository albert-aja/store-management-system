package com.sms.repossession.dto;

import lombok.Data;

@Data
public class CompleteStockReturnRequest {

    private String customerRefusalReason;

    private String notes;
}
