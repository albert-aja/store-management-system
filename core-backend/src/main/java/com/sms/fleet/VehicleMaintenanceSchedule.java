package com.sms.fleet;

import com.sms.common.audit.BaseEntity;
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
@Table(name = "vehicle_maintenance_schedule")
@Getter
@Setter
@NoArgsConstructor
public class VehicleMaintenanceSchedule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "maintenance_type", nullable = false, length = 50)
    private String maintenanceType;

    @Column(name = "target_odometer_km")
    private Integer targetOdometerKm;

    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Column(name = "actual_cost", precision = 15, scale = 2)
    private BigDecimal actualCost;

    @Column(name = "service_center", length = 150)
    private String serviceCenter;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "SCHEDULED";

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}

