package com.sms.expense;

import com.sms.expense.dto.ApproveBudgetRequest;
import com.sms.expense.dto.BudgetRequestResponse;
import com.sms.expense.dto.CreateBudgetRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/budget-requests")
@RequiredArgsConstructor
public class BudgetRequestController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<BudgetRequestResponse>> listBudgetRequests(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "month", required = false) Integer month) {
        return ResponseEntity.ok(expenseService.listBudgetRequests(storeId, year, month));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('BUDGET_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<BudgetRequestResponse> createBudgetRequest(
            @Valid @RequestBody CreateBudgetRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createBudgetRequest(req));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('BUDGET_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<BudgetRequestResponse> approveBudgetRequest(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveBudgetRequest req) {
        return ResponseEntity.ok(expenseService.approveBudgetRequest(id, req));
    }
}
