package com.sms.repossession.dto;

import com.sms.repossession.ReturnDisposition;
import com.sms.repossession.StockReturnDisposition;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StockReturnDispositionResponse {
    private UUID id;
    private UUID stockReturnId;
    private UUID inspectorEmployeeId;
    private String inspectorEmployeeName;
    private String conditionNotes;
    private ReturnDisposition disposition;
    private BigDecimal resalePrice;
    private Instant inspectedAt;

    public static StockReturnDispositionResponse from(StockReturnDisposition d) {
        if (d == null) return null;
        return StockReturnDispositionResponse.builder()
                .id(d.getId())
                .stockReturnId(d.getStockReturn().getId())
                .inspectorEmployeeId(d.getInspectorEmployee().getId())
                .inspectorEmployeeName(d.getInspectorEmployee().getFullName())
                .conditionNotes(d.getConditionNotes())
                .disposition(d.getDisposition())
                .resalePrice(d.getResalePrice())
                .inspectedAt(d.getInspectedAt())
                .build();
    }
}
