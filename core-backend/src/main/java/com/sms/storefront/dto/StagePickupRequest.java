package com.sms.storefront.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StagePickupRequest {
    private UUID fulfillmentGroupId;
    private String orderNumber;
    private Integer groupNumber;

    @NotBlank(message = "Staging rack location is required (e.g., Rak A-02 Showroom)")
    private String stagingRackLocation;

    private String stagedByStaffName;
    private String notes;
}

