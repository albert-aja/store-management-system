package com.sms.repossession.dto;

import com.sms.repossession.StockDisposal;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockDisposalResponse {
    private UUID id;
    private String disposalNumber;
    private UUID storeId;
    private String storeName;
    private UUID stockUnitId;
    private String manufacturerSerial;
    private String productVariantName;
    private String reason;
    private String buyerName;
    private BigDecimal scrapProceeds;
    private UUID authorizedById;
    private String authorizedByName;
    private Instant disposedAt;
    private String notes;
    private Instant createdAt;

    public static StockDisposalResponse from(StockDisposal d) {
        return StockDisposalResponse.builder()
                .id(d.getId())
                .disposalNumber(d.getDisposalNumber())
                .storeId(d.getStore().getId())
                .storeName(d.getStore().getName())
                .stockUnitId(d.getStockUnit().getId())
                .manufacturerSerial(d.getStockUnit().getManufacturerSerial())
                .productVariantName(d.getStockUnit().getProductVariant() != null ? d.getStockUnit().getProductVariant().getVariantName() : null)
                .reason(d.getReason())
                .buyerName(d.getBuyerName())
                .scrapProceeds(d.getScrapProceeds())
                .authorizedById(d.getAuthorizedBy().getId())
                .authorizedByName(d.getAuthorizedBy().getFullName())
                .disposedAt(d.getDisposedAt())
                .notes(d.getNotes())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
