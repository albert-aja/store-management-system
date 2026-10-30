package com.sms.customer.crm;

import com.sms.common.security.SmsUserPrincipal;
import com.sms.customer.crm.dto.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class Customer360Controller {

    private final Customer360Service customer360Service;

    // --- Customer 360 Summary & Timeline (J.1, J.2) ---
    @GetMapping("/{id}/360")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public Customer360Response getSummary(@PathVariable UUID id) {
        return customer360Service.getCustomer360Summary(id);
    }

    // --- Tags (J.2) ---
    @GetMapping("/{id}/tags")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<CustomerTagResponse> listTags(@PathVariable UUID id) {
        return customer360Service.listTags(id);
    }

    @PostMapping("/{id}/tags")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public CustomerTagResponse addTag(
            @PathVariable UUID id,
            @Valid @RequestBody CustomerTagRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID empId = principal != null ? principal.employeeId() : null;
        return customer360Service.addTag(id, request, empId);
    }

    @DeleteMapping("/{id}/tags/{tagName}")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public void removeTag(@PathVariable UUID id, @PathVariable String tagName) {
        customer360Service.removeTag(id, tagName);
    }

    // --- Omnichannel Interactions (J.6) ---
    @GetMapping("/{id}/interactions")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<InteractionResponse> listInteractions(@PathVariable UUID id) {
        return customer360Service.listInteractions(id);
    }

    @PostMapping("/{id}/interactions")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public InteractionResponse logInteraction(
            @PathVariable UUID id,
            @Valid @RequestBody InteractionRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID empId = principal != null ? principal.employeeId() : null;
        return customer360Service.logInteraction(id, request, empId);
    }

    // --- Follow-Up Reminders (J.7) ---
    @GetMapping("/{id}/follow-ups")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<FollowUpResponse> listFollowUps(@PathVariable UUID id) {
        return customer360Service.listFollowUps(id);
    }

    @GetMapping("/crm/follow-ups/pending")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<FollowUpResponse> listPendingFollowUps() {
        return customer360Service.listPendingFollowUps();
    }

    @PostMapping("/{id}/follow-ups")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public FollowUpResponse createFollowUp(
            @PathVariable UUID id,
            @Valid @RequestBody FollowUpRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID empId = principal != null ? principal.employeeId() : null;
        return customer360Service.createFollowUp(id, request, empId);
    }

    @PostMapping("/crm/follow-ups/{followUpId}/complete")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public FollowUpResponse completeFollowUp(
            @PathVariable UUID followUpId,
            @RequestParam(required = false) String notes
    ) {
        return customer360Service.completeFollowUp(followUpId, notes);
    }

    @PostMapping("/crm/follow-ups/{followUpId}/cancel")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public FollowUpResponse cancelFollowUp(@PathVariable UUID followUpId) {
        return customer360Service.cancelFollowUp(followUpId);
    }

    // --- Promise-to-Pay (PTP) (J.3) ---
    @GetMapping("/{id}/promise-to-pay")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<PtpResponse> listPtps(@PathVariable UUID id) {
        return customer360Service.listPtps(id);
    }

    @GetMapping("/crm/promise-to-pay/pending")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<PtpResponse> listPendingPtps() {
        return customer360Service.listPendingPtps();
    }

    @PostMapping("/{id}/promise-to-pay")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public PtpResponse recordPtp(
            @PathVariable UUID id,
            @Valid @RequestBody PtpRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID empId = principal != null ? principal.employeeId() : null;
        return customer360Service.recordPtp(id, request, empId);
    }

    @PostMapping("/crm/promise-to-pay/{ptpId}/status")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_MANAGE', 'CUSTOMER_MANAGE')")
    public PtpResponse updatePtpStatus(
            @PathVariable UUID ptpId,
            @Valid @RequestBody PtpStatusUpdateRequest request
    ) {
        return customer360Service.updatePtpStatus(ptpId, request.status(), request.notes());
    }

    // --- Store Credit Ledger (J.5) ---
    @GetMapping("/{id}/store-credit")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<StoreCreditResponse> listStoreCreditEntries(@PathVariable UUID id) {
        return customer360Service.listStoreCreditEntries(id);
    }

    @PostMapping("/{id}/store-credit/grant")
    @PreAuthorize("hasAnyAuthority('STORE_CREDIT_MANAGE', 'CUSTOMER_MANAGE')")
    public StoreCreditResponse grantStoreCredit(
            @PathVariable UUID id,
            @Valid @RequestBody StoreCreditRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID empId = principal != null ? principal.employeeId() : null;
        return customer360Service.grantStoreCredit(id, request, empId);
    }

    @PostMapping("/{id}/store-credit/redeem")
    @PreAuthorize("hasAnyAuthority('STORE_CREDIT_MANAGE', 'CUSTOMER_MANAGE')")
    public StoreCreditResponse redeemStoreCredit(
            @PathVariable UUID id,
            @Valid @RequestBody StoreCreditRequest request,
            @AuthenticationPrincipal SmsUserPrincipal principal
    ) {
        UUID empId = principal != null ? principal.employeeId() : null;
        return customer360Service.redeemStoreCredit(id, request, empId);
    }

    // --- Fuzzy Duplicate Detection (J.4) ---
    @PostMapping("/crm/check-duplicate")
    @PreAuthorize("hasAnyAuthority('CUSTOMER_CRM_VIEW', 'CUSTOMER_MANAGE')")
    public List<DuplicateMatchResult> checkDuplicate(@RequestBody DuplicateCheckRequest request) {
        return customer360Service.findFuzzyDuplicates(request);
    }
}
