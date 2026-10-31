package com.sms.expense;

import com.sms.expense.dto.ApproveExpenseRequest;
import com.sms.expense.dto.BudgetConsumptionResponse;
import com.sms.expense.dto.CreateExpenseRequest;
import com.sms.expense.dto.ExpenseResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<ExpenseResponse>> listExpenses(
            @RequestParam(name = "storeId", required = false) UUID storeId,
            @RequestParam(name = "status", required = false) ExpenseStatus status,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(expenseService.listExpenses(storeId, status, startDate, endDate));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EXPENSE_CREATE') or hasRole('OWNER') or hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody CreateExpenseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createExpense(req));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('EXPENSE_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<ExpenseResponse> approveExpense(
            @PathVariable UUID id,
            @Valid @RequestBody ApproveExpenseRequest req) {
        return ResponseEntity.ok(expenseService.approveExpense(id, req));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasAuthority('EXPENSE_MANAGE') or hasRole('OWNER') or hasRole('MANAGER')")
    public ResponseEntity<ExpenseResponse> payExpense(@PathVariable UUID id) {
        return ResponseEntity.ok(expenseService.payExpense(id));
    }

    @GetMapping("/consumption")
    public ResponseEntity<List<BudgetConsumptionResponse>> getBudgetConsumption(
            @RequestParam(name = "storeId") UUID storeId,
            @RequestParam(name = "year") int year,
            @RequestParam(name = "month") int month) {
        return ResponseEntity.ok(expenseService.getBudgetConsumption(storeId, year, month));
    }
}
