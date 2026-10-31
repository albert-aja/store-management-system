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
@Table(name = "vehicle_plate_history")
@Getter
@Setter
@NoArgsConstructor
public class VehiclePlateHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "old_registration_number", nullable = false, length = 30)
    private String oldRegistrationNumber;

    @Column(name = "new_registration_number", nullable = false, length = 30)
    private String newRegistrationNumber;

    @Column(name = "change_date", nullable = false)
    private LocalDate changeDate;

    @Column(name = "reason", nullable = false, length = 100)
    private String reason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_employee_id")
    private Employee changedByEmployee;
}

