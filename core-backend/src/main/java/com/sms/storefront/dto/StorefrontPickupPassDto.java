package com.sms.storefront.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorefrontPickupPassDto {
    private String orderNumber;
    private UUID fulfillmentGroupId;
    private int groupNumber;
    private UUID pickupStoreId;
    private String pickupStoreCode;
    private String pickupStoreName;
    private String pickupStoreAddress;
    private String operatingHours;
    private String contactPhone;
    private String pickupPassCode;
    private String qrPayload;
    private String stagingStatus;
    private String stagingRackLocation;
    private Instant stagedAt;
    private Instant handedOverAt;
    private String handedOverByStaffName;
    private String recipientName;
    private String recipientPhone;
    private BigDecimal totalAmount;
    private BigDecimal requiredDepositAmount;
    private boolean depositPaid;
    private BigDecimal remainingBalance;
    private boolean fullyPaid;
    private boolean readyForCollection;
    private List<PickupItemDto> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PickupItemDto {
        private String productName;
        private String variantName;
        private String sku;
        private int quantity;
        private boolean procurementRequired;
    }
}

