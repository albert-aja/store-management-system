package com.sms.fleet;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.store.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "vehicle")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(name = "registration_number", nullable = false, unique = true, length = 30)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 50)
    private VehicleType vehicleType;

    @Column(name = "brand_model", nullable = false, length = 100)
    private String brandModel;

    @Column(name = "chassis_number", length = 100)
    private String chassisNumber;

    @Column(name = "engine_number", length = 100)
    private String engineNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Column(name = "max_payload_kg")
    private Integer maxPayloadKg;

    @Column(name = "max_volume_cbm", precision = 6, scale = 2)
    private BigDecimal maxVolumeCbm;

    @Column(name = "fuel_type", length = 50)
    private String fuelType;

    @Column(name = "odometer_km")
    private Integer odometerKm = 0;

    @Column(name = "stnk_expiry_date")
    private LocalDate stnkExpiryDate;

    @Column(name = "kir_expiry_date")
    private LocalDate kirExpiryDate;

    @Column(name = "last_service_odometer_km")
    private Integer lastServiceOdometerKm = 0;

    @Column(name = "last_service_date")
    private LocalDate lastServiceDate;

    @Column(name = "service_interval_km")
    private Integer serviceIntervalKm = 10000;
}

