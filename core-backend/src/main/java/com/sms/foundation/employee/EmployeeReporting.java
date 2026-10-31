package com.sms.foundation.employee;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Current reporting supervisor only; not a history table (README 4.3). */
@Entity
@Table(name = "employee_reporting")
@Getter
@Setter
@NoArgsConstructor
public class EmployeeReporting extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", unique = true)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supervisor_employee_id")
    private Employee supervisor;
}
