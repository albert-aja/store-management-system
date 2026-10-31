package com.sms.repossession.dto;

import com.sms.repossession.ReturnDisposition;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class RecordDispositionRequest {

    @NotNull
    private UUID inspectorEmployeeId;

    @NotBlank
    private String conditionNotes;

    @NotNull
    private ReturnDisposition disposition;

    private BigDecimal resalePrice;
}
