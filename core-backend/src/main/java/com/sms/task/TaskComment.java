package com.sms.task;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "task_comment")
@Getter
@Setter
@NoArgsConstructor
public class TaskComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private OperationalTask task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_employee_id", nullable = false)
    private Employee author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;
}

