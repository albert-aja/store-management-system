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
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehicle_fuel_log")
@Getter
@Setter
@NoArgsConstructor
public class VehicleFuelLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_employee_id")
    private Employee driverEmployee;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "odometer_km", nullable = false)
    private Integer odometerKm;

    @Column(name = "fuel_liters", nullable = false, precision = 8, scale = 2)
    private BigDecimal fuelLiters;

    @Column(name = "cost_per_liter", nullable = false, precision = 15, scale = 2)
    private BigDecimal costPerLiter;

    @Column(name = "total_cost", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "fuel_type", length = 50)
    private String fuelType;

    @Column(name = "gas_station_name", length = 150)
    private String gasStationName;

    @Column(name = "full_tank", nullable = false)
    private boolean fullTank = true;

    @Column(name = "efficiency_km_per_liter", precision = 8, scale = 2)
    private BigDecimal efficiencyKmPerLiter;

    @Column(name = "receipt_photo_url", length = 500)
    private String receiptPhotoUrl;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;
}

