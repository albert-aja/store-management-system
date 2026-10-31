package com.sms.foundation.approval;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalWorkflowStepRepository extends JpaRepository<ApprovalWorkflowStep, UUID> {

    List<ApprovalWorkflowStep> findByWorkflowIdOrderByStepOrder(UUID workflowId);
}
