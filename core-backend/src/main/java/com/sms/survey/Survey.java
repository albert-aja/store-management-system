package com.sms.survey;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import com.sms.sales.SalesOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** 1 SO -> 1 Survey -> 1 Surveyor, no resurvey loop (README 9.2). */
@Entity
@Table(name = "survey")
@Getter
@Setter
@NoArgsConstructor
public class Survey extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_order_id", unique = true)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surveyor_employee_id")
    private Employee surveyor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SurveyStatus status = SurveyStatus.PENDING;

    @Column(name = "monthly_income", precision = 14, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(name = "monthly_expenses", precision = 14, scale = 2)
    private BigDecimal monthlyExpenses;

    @Column(name = "existing_obligations", length = 500)
    private String existingObligations;

    @Column(name = "residence_notes", length = 500)
    private String residenceNotes;

    @Column(name = "employment_notes", length = 500)
    private String employmentNotes;

    @Column(name = "references_notes", length = 500)
    private String referencesNotes;

    @Column(name = "ability_to_pay_assessment", length = 500)
    private String abilityToPayAssessment;

    @Column(name = "destination_latitude", precision = 10, scale = 7)
    private BigDecimal destinationLatitude;

    @Column(name = "destination_longitude", precision = 10, scale = 7)
    private BigDecimal destinationLongitude;

    @Column(name = "alley_width_meters", precision = 5, scale = 2)
    private BigDecimal alleyWidthMeters;

    @Column(name = "stair_clearance_meters", precision = 5, scale = 2)
    private BigDecimal stairClearanceMeters;

    @Column(name = "gate_access_notes", length = 500)
    private String gateAccessNotes;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "decision_notes", length = 500)
    private String decisionNotes;
}
