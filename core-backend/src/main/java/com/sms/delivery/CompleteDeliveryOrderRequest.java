package com.sms.delivery;

import java.math.BigDecimal;

public record CompleteDeliveryOrderRequest(
        String signedBy,
        String proofPhotoUrl,
        BigDecimal codCollected,
        String codNotes,
        String notes
) {}
