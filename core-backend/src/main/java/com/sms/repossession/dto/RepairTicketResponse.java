package com.sms.repossession.dto;

import com.sms.repossession.RepairStatus;
import com.sms.repossession.RepairTicket;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RepairTicketResponse {
    private UUID id;
    private String ticketNumber;
    private UUID storeId;
    private String storeName;
    private UUID stockUnitId;
    private String manufacturerSerial;
    private String productVariantName;
    private UUID warrantyClaimId;
    private UUID stockReturnId;
    private String vendorName;
    private String problemDescription;
    private String diagnosis;
    private String actionTaken;
    private BigDecimal repairCost;
    private RepairStatus status;
    private Instant sentAt;
    private Instant completedAt;
    private String notes;
    private Instant createdAt;

    public static RepairTicketResponse from(RepairTicket r) {
        return RepairTicketResponse.builder()
                .id(r.getId())
                .ticketNumber(r.getTicketNumber())
                .storeId(r.getStore().getId())
                .storeName(r.getStore().getName())
                .stockUnitId(r.getStockUnit().getId())
                .manufacturerSerial(r.getStockUnit().getManufacturerSerial())
                .productVariantName(r.getStockUnit().getProductVariant() != null ? r.getStockUnit().getProductVariant().getVariantName() : null)
                .warrantyClaimId(r.getWarrantyClaim() != null ? r.getWarrantyClaim().getId() : null)
                .stockReturnId(r.getStockReturn() != null ? r.getStockReturn().getId() : null)
                .vendorName(r.getVendorName())
                .problemDescription(r.getProblemDescription())
                .diagnosis(r.getDiagnosis())
                .actionTaken(r.getActionTaken())
                .repairCost(r.getRepairCost())
                .status(r.getStatus())
                .sentAt(r.getSentAt())
                .completedAt(r.getCompletedAt())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
