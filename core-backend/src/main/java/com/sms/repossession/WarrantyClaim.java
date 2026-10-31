package com.sms.repossession;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
import com.sms.foundation.store.Store;
import com.sms.inventory.StockUnit;
import com.sms.sales.SalesOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Post-acceptance manufacturing defect warranty claim (README 13.4).
 */
@Entity
@Table(name = "warranty_claim")
@Getter
@Setter
@NoArgsConstructor
public class WarrantyClaim extends BaseEntity {

    @Column(name = "claim_number", nullable = false, unique = true, length = 50)
    private String claimNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id")
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_unit_id")
    private StockUnit stockUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_stock_unit_id")
    private StockUnit replacementStockUnit;

    @Column(name = "distributor_name", length = 150)
    private String distributorName;

    @Column(name = "defect_description", nullable = false, columnDefinition = "TEXT")
    private String defectDescription;

    @Column(name = "distributor_claim_ref", length = 100)
    private String distributorClaimRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "coverage_decision", nullable = false, length = 30)
    private WarrantyCoverageDecision coverageDecision = WarrantyCoverageDecision.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WarrantyClaimStatus status = WarrantyClaimStatus.OPEN;

    @Column(name = "decision_notes", columnDefinition = "TEXT")
    private String decisionNotes;

    @Column(name = "resolution_date")
    private Instant resolutionDate;
}
