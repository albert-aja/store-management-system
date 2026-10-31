package com.sms.customer.crm;

import com.sms.common.audit.BaseEntity;
import com.sms.customer.Customer;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customer_interaction")
@Getter
@Setter
@NoArgsConstructor
public class CustomerInteraction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InteractionChannel channel = InteractionChannel.PHONE_CALL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InteractionDirection direction = InteractionDirection.OUTBOUND;

    @Column(nullable = false, length = 255)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InteractionOutcome outcome = InteractionOutcome.NEUTRAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_employee_id")
    private Employee recordedBy;
}

