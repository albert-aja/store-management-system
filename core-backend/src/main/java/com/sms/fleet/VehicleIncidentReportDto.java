package com.sms.fleet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class VehicleIncidentReportDto {

    public record Response(
            UUID id,
            UUID vehicleId,
            String registrationNumber,
            UUID reporterEmployeeId,
            String reporterName,
            LocalDate incidentDate,
            String incidentType,
            String severity,
            String location,
            String description,
            boolean thirdPartyInvolved,
            String thirdPartyDetails,
            String policeReportNumber,
            String damagePhotoUrls,
            BigDecimal estimatedRepairCost,
            BigDecimal actualRepairCost,
            boolean insuranceClaimed,
            String insuranceClaimNumber,
            String status,
            String resolutionNotes,
            Instant resolvedAt,
            Instant createdAt
    ) {}

    public record CreateRequest(
            @NotNull LocalDate incidentDate,
            UUID reporterEmployeeId,
            @NotBlank String incidentType,
            @NotBlank String severity,
            String location,
            @NotBlank String description,
            Boolean thirdPartyInvolved,
            String thirdPartyDetails,
            String policeReportNumber,
            String damagePhotoUrls,
            BigDecimal estimatedRepairCost,
            Boolean insuranceClaimed,
            String insuranceClaimNumber
    ) {}

    public record UpdateStatusRequest(
            @NotBlank String status,
            BigDecimal actualRepairCost,
            String resolutionNotes
    ) {}
}

