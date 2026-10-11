package com.sms.delivery;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import com.sms.foundation.store.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Picking / Trip run for a store, driver, and optional helper (README 11.3).
 * Executes one or more customer Delivery Orders in one scheduled trip.
 */
@Entity
@Table(name = "delivery_trip")
@Getter
@Setter
@NoArgsConstructor
public class DeliveryTrip extends BaseEntity {

    @Column(name = "trip_number", nullable = false, unique = true, length = 60)
    private String tripNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "driver_employee_id")
    private Employee driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "helper_employee_id")
    private Employee helper;

    @Column(name = "vehicle_plate", length = 30)
    private String vehiclePlate;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeliveryTripStatus status = DeliveryTripStatus.PLANNED;

    @Column(name = "departed_at")
    private Instant departedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(length = 300)
    private String notes;
}
