package com.sms.repossession;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Inspection and condition disposition outcome for a returned/repossessed stock unit (README 13.2).
 */
@Entity
@Table(name = "stock_return_disposition")
@Getter
@Setter
@NoArgsConstructor
public class StockReturnDisposition extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_return_id")
    private StockReturn stockReturn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspector_employee_id")
    private Employee inspectorEmployee;

    @Column(name = "condition_notes", nullable = false, columnDefinition = "TEXT")
    private String conditionNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReturnDisposition disposition;

    @Column(name = "resale_price", precision = 15, scale = 2)
    private BigDecimal resalePrice;

    @Column(name = "inspected_at", nullable = false)
    private Instant inspectedAt = Instant.now();
}
