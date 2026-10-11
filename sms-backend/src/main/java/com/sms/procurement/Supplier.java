package com.sms.procurement;

import com.sms.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "supplier")
@Getter
@Setter
@NoArgsConstructor
public class Supplier extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 40)
    private String code;

    @Column(length = 300)
    private String address;

    @Column(length = 300)
    private String notes;

    @Column(nullable = false)
    private boolean active = true;
}
