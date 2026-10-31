package com.sms.fleet;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordVehicleServiceRequest {
    private Integer newOdometerKm;
    private LocalDate newStnkExpiryDate;
    private LocalDate newKirExpiryDate;
    private String serviceNotes;
}

