package com.sms.customer;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Company-wide master record; never physically deleted (README 5.1). */
@Entity
@Table(name = "customer")
@Getter
@Setter
@NoArgsConstructor
public class Customer extends BaseEntity {

    @Column(length = 20, unique = true)
    private String nik;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "primary_phone", length = 30)
    private String primaryPhone;

    @Column(name = "primary_email", length = 150)
    private String primaryEmail;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "mother_maiden_name", length = 150)
    private String motherMaidenName;

    @Column(name = "birth_date")
    private java.time.LocalDate birthDate;

    @Column(name = "birth_place", length = 100)
    private String birthPlace;

    @Column(length = 50, nullable = false)
    private String segment = "STANDARD";

    @Column(name = "credit_score_grade", length = 5, nullable = false)
    private String creditScoreGrade = "B";

    @Column(name = "credit_score_points", nullable = false)
    private int creditScorePoints = 80;

    @Column(name = "total_orders_count", nullable = false)
    private int totalOrdersCount = 0;

    @Column(name = "clv_amount", nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal clvAmount = java.math.BigDecimal.ZERO;
}
