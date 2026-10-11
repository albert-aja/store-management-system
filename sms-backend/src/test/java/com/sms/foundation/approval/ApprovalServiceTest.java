package com.sms.foundation.approval;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.sms.common.web.BusinessRuleException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {

    @Mock
    private ApprovalWorkflowRepository workflowRepository;
    @Mock
    private ApprovalWorkflowStepRepository workflowStepRepository;
    @Mock
    private ApprovalRequestRepository requestRepository;
    @Mock
    private ApprovalRequestStepRepository requestStepRepository;

    @InjectMocks
    private ApprovalService approvalService;

    private ApprovalWorkflow workflow;
    private ApprovalWorkflowStep step1;
    private ApprovalWorkflowStep step2;

    @BeforeEach
    void setUp() {
        workflow = new ApprovalWorkflow();
        workflow.setCode("PRICE_NEGOTIATION");

        step1 = new ApprovalWorkflowStep();
        step1.setStepOrder(1);
        step1.setApproverRoleCode("MANAGER");

        step2 = new ApprovalWorkflowStep();
        step2.setStepOrder(2);
        step2.setApproverRoleCode("OWNER");
    }

    @Test
    void createRequest_snapshotsWorkflowStepsInOrder() {
        when(workflowRepository.findByCode("PRICE_NEGOTIATION")).thenReturn(Optional.of(workflow));
        when(workflowStepRepository.findByWorkflowIdOrderByStepOrder(any())).thenReturn(List.of(step1, step2));
        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ApprovalRequest request = approvalService.createRequest(
                "PRICE_NEGOTIATION", "SALES_ORDER", UUID.randomUUID(), UUID.randomUUID());

        assertThat(request.getStatus()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(request.getCurrentStepOrder()).isEqualTo(1);
    }

    @Test
    void decideStep_rejectsWhenActorLacksApproverRole() {
        ApprovalRequest request = new ApprovalRequest();
        request.setStatus(ApprovalStatus.PENDING);
        request.setCurrentStepOrder(1);

        ApprovalRequestStep pendingStep = new ApprovalRequestStep();
        pendingStep.setStepOrder(1);
        pendingStep.setApproverRoleCode("MANAGER");

        UUID requestId = UUID.randomUUID();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(request));
        when(requestStepRepository.findByRequestIdAndStepOrder(requestId, 1)).thenReturn(Optional.of(pendingStep));

        assertThatThrownBy(() -> approvalService.decideStep(
                requestId, 1, UUID.randomUUID(), Set.of("SALESPERSON"), true, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void decideStep_rejectsOutOfOrderStep() {
        ApprovalRequest request = new ApprovalRequest();
        request.setStatus(ApprovalStatus.PENDING);
        request.setCurrentStepOrder(1);

        UUID requestId = UUID.randomUUID();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> approvalService.decideStep(
                requestId, 2, UUID.randomUUID(), Set.of("OWNER"), true, null))
                .isInstanceOf(BusinessRuleException.class);
    }
}
