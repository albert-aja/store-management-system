package com.sms.repossession.dto;

import com.sms.repossession.WarrantyClaim;
import com.sms.repossession.WarrantyClaimStatus;
import com.sms.repossession.WarrantyCoverageDecision;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WarrantyClaimResponse {
    private UUID id;
    private String claimNumber;
    private UUID storeId;
    private String storeName;
    private UUID customerId;
    private String customerName;
    private UUID salesOrderId;
    private String salesOrderNumber;
    private UUID stockUnitId;
    private String manufacturerSerial;
    private String productVariantName;
    private UUID replacementStockUnitId;
    private String replacementManufacturerSerial;
    private String distributorName;
    private String defectDescription;
    private String distributorClaimRef;
    private WarrantyCoverageDecision coverageDecision;
    private WarrantyClaimStatus status;
    private String decisionNotes;
    private Instant resolutionDate;
    private Instant createdAt;

    public static WarrantyClaimResponse from(WarrantyClaim c) {
        return WarrantyClaimResponse.builder()
                .id(c.getId())
                .claimNumber(c.getClaimNumber())
                .storeId(c.getStore().getId())
                .storeName(c.getStore().getName())
                .customerId(c.getCustomer() != null ? c.getCustomer().getId() : null)
                .customerName(c.getCustomer() != null ? c.getCustomer().getFullName() : null)
                .salesOrderId(c.getSalesOrder() != null ? c.getSalesOrder().getId() : null)
                .salesOrderNumber(c.getSalesOrder() != null ? c.getSalesOrder().getNumber() : null)
                .stockUnitId(c.getStockUnit() != null ? c.getStockUnit().getId() : null)
                .manufacturerSerial(c.getStockUnit() != null ? c.getStockUnit().getManufacturerSerial() : null)
                .productVariantName(c.getStockUnit() != null && c.getStockUnit().getProductVariant() != null ? c.getStockUnit().getProductVariant().getVariantName() : null)
                .replacementStockUnitId(c.getReplacementStockUnit() != null ? c.getReplacementStockUnit().getId() : null)
                .replacementManufacturerSerial(c.getReplacementStockUnit() != null ? c.getReplacementStockUnit().getManufacturerSerial() : null)
                .distributorName(c.getDistributorName())
                .defectDescription(c.getDefectDescription())
                .distributorClaimRef(c.getDistributorClaimRef())
                .coverageDecision(c.getCoverageDecision())
                .status(c.getStatus())
                .decisionNotes(c.getDecisionNotes())
                .resolutionDate(c.getResolutionDate())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
