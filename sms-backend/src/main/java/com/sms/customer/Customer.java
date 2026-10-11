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
}
