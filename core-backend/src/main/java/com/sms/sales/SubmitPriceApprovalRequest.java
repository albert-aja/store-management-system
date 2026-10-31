package com.sms.sales;

import jakarta.validation.constraints.NotBlank;

public record SubmitPriceApprovalRequest(@NotBlank String workflowCode) {
}
