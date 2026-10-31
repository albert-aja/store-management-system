package com.sms.fleet;

import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tracking_location")
@Getter
@Setter
@NoArgsConstructor
public class TrackingLocation {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tracking_session_id")
    private TrackingSession trackingSession;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "accuracy_meters", precision = 6, scale = 2)
    private BigDecimal accuracyMeters;

    @Column(name = "speed_mps", precision = 6, scale = 2)
    private BigDecimal speedMps;

    @Column(name = "heading_degrees", precision = 6, scale = 2)
    private BigDecimal headingDegrees;

    @Column(name = "altitude_meters", precision = 7, scale = 2)
    private BigDecimal altitudeMeters;

    @Column(name = "battery_level_pct")
    private Integer batteryLevelPct;

    @Column(name = "is_mock_provider")
    private Boolean isMockProvider = false;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "ingested_at", nullable = false, updatable = false)
    private Instant ingestedAt = Instant.now();
}

