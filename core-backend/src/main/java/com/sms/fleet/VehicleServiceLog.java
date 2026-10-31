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
@Table(name = "vehicle_service_log")
@Getter
@Setter
@NoArgsConstructor
public class VehicleServiceLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType;

    @Column(name = "odometer_km", nullable = false)
    private Integer odometerKm;

    @Column(name = "service_center", length = 150)
    private String serviceCenter;

    @Column(name = "cost_amount", precision = 15, scale = 2)
    private BigDecimal costAmount = BigDecimal.ZERO;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "parts_replaced", columnDefinition = "TEXT")
    private String partsReplaced;

    @Column(name = "next_service_odometer_km")
    private Integer nextServiceOdometerKm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_employee_id")
    private Employee performedByEmployee;
}

