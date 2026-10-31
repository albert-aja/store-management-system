package com.sms.fleet;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehicle_monthly_health_check")
@Getter
@Setter
@NoArgsConstructor
public class VehicleMonthlyHealthCheck extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "check_date", nullable = false)
    private LocalDate checkDate;

    @Column(name = "check_month", nullable = false, length = 7)
    private String checkMonth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspector_employee_id")
    private Employee inspectorEmployee;

    @Column(name = "inspector_name", length = 150)
    private String inspectorName;

    @Column(name = "overall_rating", nullable = false, length = 30)
    private String overallRating; // HEALTHY, ATTENTION_NEEDED, UNFIT_FOR_ROAD

    @Column(name = "engine_oil_status", length = 30)
    private String engineOilStatus = "NORMAL";

    @Column(name = "radiator_coolant_status", length = 30)
    private String radiatorCoolantStatus = "NORMAL";

    @Column(name = "brake_fluid_status", length = 30)
    private String brakeFluidStatus = "NORMAL";

    @Column(name = "brake_condition", length = 30)
    private String brakeCondition = "GOOD";

    @Column(name = "front_tire_condition", length = 30)
    private String frontTireCondition = "GOOD";

    @Column(name = "rear_tire_condition", length = 30)
    private String rearTireCondition = "GOOD";

    @Column(name = "tire_pressure_psi")
    private Integer tirePressurePsi;

    @Column(name = "battery_condition", length = 30)
    private String batteryCondition = "GOOD";

    @Column(name = "headlamps_and_signals_status", length = 30)
    private String headlampsAndSignalsStatus = "ALL_WORKING";

    @Column(name = "horn_and_wipers_status", length = 30)
    private String hornAndWipersStatus = "WORKING";

    @Column(name = "safety_equipment_present")
    private Boolean safetyEquipmentPresent = true;

    @Column(name = "apar_expiry_date")
    private LocalDate aparExpiryDate;

    @Column(name = "cargo_box_condition", length = 30)
    private String cargoBoxCondition = "GOOD";

    @Column(name = "odometer_reading_km")
    private Integer odometerReadingKm;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "action_required", columnDefinition = "TEXT")
    private String actionRequired;

    @Column(name = "next_check_due_date")
    private LocalDate nextCheckDueDate;
}

