package com.sms.foundation.approval;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRequestStepRepository extends JpaRepository<ApprovalRequestStep, UUID> {

    List<ApprovalRequestStep> findByRequestIdOrderByStepOrder(UUID requestId);

    Optional<ApprovalRequestStep> findByRequestIdAndStepOrder(UUID requestId, int stepOrder);
}
