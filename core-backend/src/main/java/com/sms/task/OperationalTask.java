package com.sms.task;

import com.sms.common.audit.BaseEntity;
import com.sms.foundation.employee.Employee;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "operational_task")
@Getter
@Setter
@NoArgsConstructor
public class OperationalTask extends BaseEntity {

    @Column(name = "task_number", nullable = false, unique = true, length = 40)
    private String taskNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TaskCategory category = TaskCategory.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "due_date")
    private Instant dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigner_employee_id", nullable = false)
    private Employee assigner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_employee_id", nullable = false)
    private Employee assignee;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<TaskComment> comments = new ArrayList<>();
}

