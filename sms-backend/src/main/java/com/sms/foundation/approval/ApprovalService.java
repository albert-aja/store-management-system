package com.sms.foundation.approval;

import com.sms.common.web.BusinessRuleException;
import com.sms.common.web.NotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ApprovalService {

    private final ApprovalWorkflowRepository workflowRepository;
    private final ApprovalWorkflowStepRepository workflowStepRepository;
    private final ApprovalRequestRepository requestRepository;
    private final ApprovalRequestStepRepository requestStepRepository;

    public ApprovalWorkflow createWorkflow(String code, String name, String description) {
        ApprovalWorkflow workflow = new ApprovalWorkflow();
        workflow.setCode(code);
        workflow.setName(name);
        workflow.setDescription(description);
        return workflowRepository.save(workflow);
    }

    public ApprovalWorkflowStep addStep(UUID workflowId, int stepOrder, String name, String approverRoleCode, String description) {
        ApprovalWorkflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new NotFoundException("Workflow not found: " + workflowId));
        ApprovalWorkflowStep step = new ApprovalWorkflowStep();
        step.setWorkflow(workflow);
        step.setStepOrder(stepOrder);
        step.setName(name);
        step.setApproverRoleCode(approverRoleCode);
        step.setDescription(description);
        return workflowStepRepository.save(step);
    }

    @Transactional(readOnly = true)
    public List<ApprovalWorkflow> listWorkflows() {
        return workflowRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ApprovalWorkflowStep> listSteps(UUID workflowId) {
        return workflowStepRepository.findByWorkflowIdOrderByStepOrder(workflowId);
    }

    /** Creates a request and snapshots the workflow's current steps so later workflow edits never rewrite it. */
    public ApprovalRequest createRequest(String workflowCode, String referenceType, UUID referenceId, UUID requestedBy) {
        ApprovalWorkflow workflow = workflowRepository.findByCode(workflowCode)
                .orElseThrow(() -> new NotFoundException("Workflow not found: " + workflowCode));
        List<ApprovalWorkflowStep> steps = workflowStepRepository.findByWorkflowIdOrderByStepOrder(workflow.getId());

        ApprovalRequest request = new ApprovalRequest();
        request.setWorkflow(workflow);
        request.setReferenceType(referenceType);
        request.setReferenceId(referenceId);
        request.setRequestedBy(requestedBy);
        request.setCurrentStepOrder(1);
        request.setStatus(steps.isEmpty() ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING);
        if (steps.isEmpty()) {
            request.setDecidedAt(Instant.now());
        }
        request = requestRepository.save(request);

        for (ApprovalWorkflowStep step : steps) {
            ApprovalRequestStep requestStep = new ApprovalRequestStep();
            requestStep.setRequest(request);
            requestStep.setStepOrder(step.getStepOrder());
            requestStep.setName(step.getName());
            requestStep.setApproverRoleCode(step.getApproverRoleCode());
            requestStepRepository.save(requestStep);
        }
        return request;
    }

    /** Approves or rejects the current pending step; enforces sequential order and approver-role authorization. */
    public ApprovalRequest decideStep(UUID requestId, int stepOrder, UUID decidedBy, Set<String> actingRoles,
                                       boolean approve, String comment) {
        ApprovalRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Approval request not found: " + requestId));
        if (request.getStatus() != ApprovalStatus.PENDING) {
            throw new BusinessRuleException("Request is no longer pending: " + request.getStatus());
        }
        if (stepOrder != request.getCurrentStepOrder()) {
            throw new BusinessRuleException("Step " + stepOrder + " is not the current step ("
                    + request.getCurrentStepOrder() + ")");
        }
        ApprovalRequestStep step = requestStepRepository.findByRequestIdAndStepOrder(requestId, stepOrder)
                .orElseThrow(() -> new NotFoundException("Step not found: " + stepOrder));
        if (!actingRoles.contains(step.getApproverRoleCode())) {
            throw new AccessDeniedException("Role " + step.getApproverRoleCode() + " is required to decide this step");
        }

        step.setDecidedBy(decidedBy);
        step.setDecidedAt(Instant.now());
        step.setComment(comment);

        if (approve) {
            step.setStatus(StepStatus.APPROVED);
            List<ApprovalRequestStep> allSteps = requestStepRepository.findByRequestIdOrderByStepOrder(requestId);
            boolean isLastStep = allSteps.stream().mapToInt(ApprovalRequestStep::getStepOrder).max().orElse(0) == stepOrder;
            if (isLastStep) {
                request.setStatus(ApprovalStatus.APPROVED);
                request.setDecidedAt(Instant.now());
            } else {
                request.setCurrentStepOrder(stepOrder + 1);
            }
        } else {
            step.setStatus(StepStatus.REJECTED);
            request.setStatus(ApprovalStatus.REJECTED);
            request.setDecidedAt(Instant.now());
            requestStepRepository.findByRequestIdOrderByStepOrder(requestId).stream()
                    .filter(s -> s.getStepOrder() > stepOrder && s.getStatus() == StepStatus.PENDING)
                    .forEach(s -> s.setStatus(StepStatus.SKIPPED));
        }
        return request;
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestStep> listRequestSteps(UUID requestId) {
        return requestStepRepository.findByRequestIdOrderByStepOrder(requestId);
    }
}
