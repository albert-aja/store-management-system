package com.sms.fleet;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehicle_incident_report")
@Getter
@Setter
@NoArgsConstructor
public class VehicleIncidentReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_employee_id")
    private Employee reporterEmployee;

    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(name = "incident_type", nullable = false, length = 50)
    private String incidentType;

    @Column(name = "severity", nullable = false, length = 30)
    private String severity = "LOW";

    @Column(name = "location", length = 255)
    private String location;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "third_party_involved", nullable = false)
    private boolean thirdPartyInvolved = false;

    @Column(name = "third_party_details", columnDefinition = "TEXT")
    private String thirdPartyDetails;

    @Column(name = "police_report_number", length = 100)
    private String policeReportNumber;

    @Column(name = "damage_photo_urls", columnDefinition = "TEXT")
    private String damagePhotoUrls;

    @Column(name = "estimated_repair_cost", precision = 15, scale = 2)
    private BigDecimal estimatedRepairCost = BigDecimal.ZERO;

    @Column(name = "actual_repair_cost", precision = 15, scale = 2)
    private BigDecimal actualRepairCost;

    @Column(name = "insurance_claimed", nullable = false)
    private boolean insuranceClaimed = false;

    @Column(name = "insurance_claim_number", length = 100)
    private String insuranceClaimNumber;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "REPORTED";

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}

