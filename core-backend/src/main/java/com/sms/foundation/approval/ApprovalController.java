package com.sms.foundation.approval;

import com.sms.common.security.SmsUserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping("/workflows")
    @PreAuthorize("hasAuthority('APPROVAL_WORKFLOW_MANAGE')")
    public ApprovalWorkflow createWorkflow(@Valid @RequestBody WorkflowRequest request) {
        return approvalService.createWorkflow(request.code(), request.name(), request.description());
    }

    @GetMapping("/workflows")
    public List<ApprovalWorkflow> listWorkflows() {
        return approvalService.listWorkflows();
    }

    @PostMapping("/workflows/{workflowId}/steps")
    @PreAuthorize("hasAuthority('APPROVAL_WORKFLOW_MANAGE')")
    public ApprovalWorkflowStep addStep(@PathVariable UUID workflowId, @Valid @RequestBody WorkflowStepRequest request) {
        return approvalService.addStep(workflowId, request.stepOrder(), request.name(),
                request.approverRoleCode(), request.description());
    }

    @GetMapping("/workflows/{workflowId}/steps")
    public List<ApprovalWorkflowStep> listSteps(@PathVariable UUID workflowId) {
        return approvalService.listSteps(workflowId);
    }

    @PostMapping("/requests")
    public ApprovalRequestResponse createRequest(@Valid @RequestBody CreateRequestRequest request,
                                                  @AuthenticationPrincipal SmsUserPrincipal principal) {
        return ApprovalRequestResponse.from(approvalService.createRequest(
                request.workflowCode(), request.referenceType(), request.referenceId(), principal.employeeId()));
    }

    @GetMapping("/requests/{requestId}/steps")
    public List<ApprovalRequestStep> listRequestSteps(@PathVariable UUID requestId) {
        return approvalService.listRequestSteps(requestId);
    }

    @PostMapping("/requests/{requestId}/steps/{stepOrder}/decide")
    public ApprovalRequestResponse decideStep(@PathVariable UUID requestId, @PathVariable int stepOrder,
                                               @Valid @RequestBody DecideStepRequest request,
                                               @AuthenticationPrincipal SmsUserPrincipal principal) {
        return ApprovalRequestResponse.from(approvalService.decideStep(requestId, stepOrder,
                principal.employeeId(), principal.roles(), request.approve(), request.comment()));
    }
}
